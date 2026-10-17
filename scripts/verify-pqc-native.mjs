import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import * as native from "node:crypto";
import { spawnSync } from "node:child_process";

// Solo datos sintéticos y claves efímeras: no importa env, auth ni adaptadores de pagos.
const repo=resolve(process.argv[2] || process.cwd());
const output=process.argv[3] ? resolve(process.argv[3]) : mkdtempSync(join(tmpdir(),"terracierta-pqc-"));
assert.equal(typeof native.encapsulate,"function","Se requiere Node con ML-KEM en node:crypto (ver docs/demo-pqc-jurado.md)");
mkdirSync(output,{recursive:true});
const req=createRequire(join(repo,"package.json")), ts=req("typescript");
const sourceHashes={};
function source(name,replacements={}) {
 const file=join(repo,"src/payments/pqc",name+".ts"), code=readFileSync(file,"utf8");
 sourceHashes[name+".ts"]=native.createHash("sha256").update(code).digest("hex");
 let js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 for(const [spec,url] of Object.entries(replacements)) js=js.replaceAll(JSON.stringify(spec),JSON.stringify(url));
 js=js.replace(/from "(@noble\/[^"]+)"/g,(_,spec)=>'from '+JSON.stringify(pathToFileURL(req.resolve(spec)).href));
 return "data:text/javascript;base64,"+Buffer.from(js).toString("base64");
}
const encoding=source("encoding"), receiptUrl=source("hybridReceipt",{"./encoding":encoding});
const channelUrl=source("channel",{"./encoding":encoding,"./hybridReceipt":receiptUrl});
const {createHybridSigner,verifyReceipt,canonicalize}=await import(receiptUrl);
const {createChannel,verifyChannelKey,clientSeal,clientOpen}=await import(channelUrl);
function der(tag,data) {
 const size=data.length;
 const n=size<128?Buffer.from([size]):size<256?Buffer.from([0x81,size]):Buffer.from([0x82,size>>8,size&255]);
 return Buffer.concat([Buffer.from([tag]),n,data]);
}
function spki(raw,oid) {
 return der(0x30,Buffer.concat([der(0x30,der(6,Buffer.from(oid,"hex"))),der(3,Buffer.concat([Buffer.from([0]),raw]))]));
}
const checks=[];
function check(name,value){assert.equal(value,true,name);checks.push({name,pass:true});}
const signer=createHybridSigner(), payload={pagoId:"synthetic-evidence-only",amount:{value:"500",assetCode:"COP",assetScale:0},receiver:"https://example.invalid/seller",estado:"completado",canalPqc:true};
const receipt=signer.sign(payload), message=Buffer.from(canonicalize(payload));
const pqDer=spki(Buffer.from(receipt.publicKeys.mlDsa65,"base64"),"608648016503040312");
const edDer=spki(Buffer.from(receipt.publicKeys.ed25519,"base64"),"2b6570");
for(const [name,keyDer,sig] of [["ML-DSA-65",pqDer,receipt.signatures.mlDsa65],["Ed25519",edDer,receipt.signatures.ed25519]]) {
 const key=native.createPublicKey({key:keyDer,format:"der",type:"spki"});
 check(name+" app signature verifies with native OpenSSL provider",native.verify(null,message,key,Buffer.from(sig,"base64")));
 check(name+" native rejects changed message",!native.verify(null,Buffer.concat([message,Buffer.from("changed")]),key,Buffer.from(sig,"base64")));
}
writeFileSync(join(output,"message.json"),message);
writeFileSync(join(output,"message-altered.json"),Buffer.concat([message,Buffer.from("changed")]));
writeFileSync(join(output,"ml-dsa-65-public.der"),pqDer);
writeFileSync(join(output,"ml-dsa-65.sig"),Buffer.from(receipt.signatures.mlDsa65,"base64"));
writeFileSync(join(output,"receipt.json"),JSON.stringify(receipt,null,2));
const openssl=process.env.PQC_OPENSSL_BINARY||"/opt/homebrew/opt/openssl@3/bin/openssl";
const cliVersion=spawnSync(openssl,["version"],{encoding:"utf8"});
assert.equal(cliVersion.status,0,"OpenSSL no está disponible. Configura PQC_OPENSSL_BINARY con un binario compatible con ML-DSA");
const verifyArgs=["pkeyutl","-verify","-pubin","-keyform","DER","-inkey",join(output,"ml-dsa-65-public.der"),"-sigfile",join(output,"ml-dsa-65.sig"),"-rawin","-in"];
const cliGood=spawnSync(openssl,[...verifyArgs,join(output,"message.json")],{encoding:"utf8"});
const cliBad=spawnSync(openssl,[...verifyArgs,join(output,"message-altered.json")],{encoding:"utf8"});
check("OpenSSL CLI verifies app ML-DSA-65 signature",cliGood.status===0);
check("OpenSSL CLI rejects altered message",cliBad.status===1);

const channel=createChannel(signer), bundle=channel.publicBundle();
const kemDer=spki(Buffer.from(bundle.publicKey,"base64"),"608648016503040402");
const nEnc=native.encapsulate(native.createPublicKey({key:kemDer,format:"der",type:"spki"}));
const meta={v:1,keyId:bundle.keyId,requestId:native.randomUUID(),issuedAt:Date.now()};
const context="/api/pasarela/echo", iv=native.randomBytes(12);
const aad=Buffer.from(canonicalize({domain:"terracierta-pasarela-v1",...meta,context,direction:"request"}));
const aesKey=native.hkdfSync("sha256",nEnc.sharedKey,Buffer.alloc(32),Buffer.from("terracierta-pasarela-v1:request"),32);
const cipher=native.createCipheriv("aes-256-gcm",aesKey,iv);cipher.setAAD(aad);
const encrypted=Buffer.concat([cipher.update(message),cipher.final(),cipher.getAuthTag()]);
const envelope={...meta,iv:iv.toString("base64"),ciphertext:encrypted.toString("base64"),kem:nEnc.ciphertext.toString("base64")};
const opened=await channel.decrypt(envelope,context);
check("Native ML-KEM encapsulation + HKDF/AES request opens in app",canonicalize(opened.payload)===canonicalize(payload));
check("App reply opens using native shared secret",canonicalize(await clientOpen({envelope,sharedSecret:nEnc.sharedKey,context},await opened.encryptReply(payload)))===canonicalize(payload));

const nativeKem=native.generateKeyPairSync("ml-kem-768"), nativeDer=nativeKem.publicKey.export({type:"spki",format:"der"});
const raw=nativeDer.subarray(nativeDer.length-1184);
assert.deepEqual(spki(raw,"608648016503040402"),nativeDer);
const keyPayload={alg:"ML-KEM-768",keyId:native.randomUUID(),issuedAt:new Date().toISOString(),publicKey:raw.toString("base64")};
const r=signer.sign(keyPayload), nativeBundle={...keyPayload,signature:{alg:r.alg,publicKeys:r.publicKeys,signatures:r.signatures}};
const sealed=await clientSeal(nativeBundle,payload,context);
check("App ML-KEM encapsulation decapsulates in native provider",Buffer.from(sealed.sharedSecret).equals(native.decapsulate(nativeKem.privateKey,Buffer.from(sealed.envelope.kem,"base64"))));
check("Verifier accepts a complete self-signed replacement bundle (trust limitation)",verifyChannelKey(createChannel(createHybridSigner()).publicBundle()));
check("New runtime keys do not verify prior receipt",!verifyReceipt(receipt,createHybridSigner().publicKeys).valid);
const report={date:new Date().toISOString(),purpose:"Synthetic PQC interoperability and trust-limit checks; no payments or real credentials",node:process.version,nodeOpenSSL:process.versions.openssl,opensslCli:cliVersion.stdout.trim(),sourceHashes,interopIntegrity:checks.slice(0,9),knownLimits:checks.slice(9),cli:{good:{status:cliGood.status,stdout:cliGood.stdout.trim(),stderr:cliGood.stderr.trim()},altered:{status:cliBad.status,stdout:cliBad.stdout.trim(),stderr:cliBad.stderr.trim()}},limitations:["Not a cryptographic audit, FIPS validation or proof of production security","No browser engine side-channel testing","Native-generated private test keys remain in memory and are not exported","Replacement-bundle acceptance presumes replacement of trusted distribution; it does not demonstrate compromise of HTTPS or login","No durability, isolated executor or live payment tested"]};
writeFileSync(join(output,"result.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,output},null,2));
