import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const runtimeModules=process.env.RUNTIME_NODE_MODULES;
if(!runtimeModules || !process.env.PRESENTATIONS_SKILL_DIR || !process.env.RUNTIME_PYTHON) throw new Error('Configura RUNTIME_NODE_MODULES, PRESENTATIONS_SKILL_DIR y RUNTIME_PYTHON con el runtime de documentos de Codex.');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtimeModules,'@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {PDFDocument}=await import(pathToFileURL(path.join(runtimeModules,'pdf-lib/cjs/index.js')).href);

const repo=path.resolve(import.meta.dirname,'../..');
const workspaceDir=path.join(repo,'docs/presentacion-pqc');
const SKILL_DIR=process.env.PRESENTATIONS_SKILL_DIR;
const RUNTIME_PYTHON=process.env.RUNTIME_PYTHON;
await Promise.all(['.build','entrega','preview'].map((dir)=>fs.mkdir(path.join(workspaceDir,dir),{recursive:true})));
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={cream:'#F3EEDC',forest:'#314130',ink:'#263326',copper:'#9B542D',muted:'#586554',line:'#CBBF9F',white:'#FFFFFF',red:'#A73E36'};
const FONT='Arial', DISPLAY='Georgia';
let index=0;

function text(s,value,x,y,w,h,size=28,color=C.ink,bold=false,font=FONT){
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=value;sh.text.style={fontSize:size,typeface:font,color,bold,autoFit:'none',insets:0,verticalAlignment:'top'};return sh;
}
function slide(title,notes='',dark=false){
 const s=p.slides.add();s.background.fill=dark?C.forest:C.cream;index++;
 if(title)text(s,title,64,50,1152,88,44,dark?C.cream:C.forest,false,DISPLAY);
 text(s,`${String(index).padStart(2,'0')}  TerraCierta · Onyx`,64,674,780,24,16,dark?C.cream:C.muted);
 s.speakerNotes.text=notes;return s;
}
function node(s,label,x,y,w=260,h=105,accent=false){
 const sh=s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill:accent?C.forest:C.cream,line:{fill:C.forest,width:1.7}});
 sh.text=label;sh.text.style={fontSize:25,typeface:FONT,color:accent?C.cream:C.forest,alignment:'center',verticalAlignment:'middle',insets:12};return sh;
}
function connect(s,a,b,{from='right',to='left',dashed=false}={}){s.shapes.connect(a,b,{kind:'straight',fromSide:from,toSide:to,line:{fill:C.copper,width:2,style:dashed?'dashed':'solid'},tail:{type:'arrow',width:'med',length:'med'}});}
function table(s,values,x,y,w,h,widths,size=22){
 const tb=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,values,columnWidths:widths});
 for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){
  const cell=tb.getCell(r,c);cell.fill=r===0?C.forest:C.cream;cell.text.style={fontSize:size,typeface:FONT,color:r===0?C.cream:C.ink,bold:r===0,insets:10,verticalAlignment:'middle'};
 }
 tb.cells.block({row:0,column:0,rowCount:values.length,columnCount:values[0].length}).assign({margins:{top:4,bottom:4,left:8,right:8}});
 tb.borders.assign({fill:C.line,width:.65,style:'solid'});return tb;
}

// 1. Portada tipográfica, sin cifras ni promesas de producción.
{
 const s=slide('', 'Presentación de la contribución de ciberseguridad de la pasarela. La demo aplica criptografía poscuántica en la capa de aplicación. Open Payments mantiene su propio protocolo de autorización. No afirmamos haber roto una clave real con una computadora cuántica.',true);
 text(s,'T E R R A C I E R T A',68,72,1100,44,26,C.cream,false,DISPLAY);
 text(s,'Pagos con evidencia\npostcuántica',64,194,1130,210,76,C.cream,false,DISPLAY);
 text(s,'Ciberseguridad de la pasarela de café',68,455,1100,60,30,C.cream);
 text(s,'Hackathon Open Payments · Medellín · 2026',68,535,1100,42,23,C.cream);
}
// 2. El flujo del dinero y el acceso por rol.
{
 const s=slide('El café llega al comprador. El pago llega al productor', 'Contexto de negocio del repositorio y de la guía de hackathon. Diagrama del flujo previsto: comprador compra café del catálogo, cooperativa paga sus ofertas, caficultor recibe. El rol del selector del laboratorio es solo una vista previa. La identidad autorizada viene del servidor. Las flechas representan pagos wallet a wallet y no custodia de la plataforma.');
 const b=node(s,'Comprador\nPaga una orden',64,190,300,112);
 const c=node(s,'Cooperativa\nPaga una oferta',64,390,300,112);
 const f=node(s,'Caficultor\nRecibe en su wallet',800,284,390,128,true);
 connect(s,b,f);connect(s,c,f);
 text(s,'Open Payments',430,306,320,44,28,C.copper,true);
 text(s,'Quien paga autoriza en su wallet',64,570,1140,42,29,C.forest,true);
 text(s,'El productor consulta su cobro sin aprobar la recepción.',64,620,1140,36,24,C.muted);
}
// 3. Frontera de la protección.
{
 const s=slide('Dónde termina la protección PQC de la app', 'Fuentes de código: src/payments/pqc/channel.ts, src/payments/pqc/hybridReceipt.ts, src/payments/openPayments.ts y sdkAdapter.ts. El canal de aplicación termina al descifrar en Next.js. No se ha desplegado TLS poscuántico entre todos los proveedores. El entorno local usa HTTP de loopback. El bundle actual se obtiene por el origen de confianza y está autofirmado, por lo que todavía necesita una raíz de confianza y gestión de claves para producción. Open Payments/GNAP conserva la aprobación del titular.');
 const browser=node(s,'Navegador',64,230,260,105);
 const gateway=node(s,'Pasarela\nNext.js',510,230,260,105,true);
 const provider=node(s,'Proveedor\nOpen Payments',956,230,260,105);
 connect(s,browser,gateway);connect(s,gateway,provider);
 text(s,'ML-KEM + AES-GCM',322,166,350,40,23,C.copper,true);
 text(s,'SDK + HTTPS',814,166,330,40,23,C.copper,true);
 const wallet=node(s,'Wallet del pagador\nConsentimiento GNAP',775,465,440,105);
 connect(s,provider,wallet,{from:'bottom',to:'top'});
 text(s,'Recibos con Ed25519 + ML-DSA-65',64,390,690,43,27,C.forest,true);
 text(s,'La autorización y la protección\ncriptográfica cumplen funciones distintas.',64,500,640,92,27,C.muted);
}
// 4. Riesgos completos, sin atribuir a PQC todas las mitigaciones.
{
 const s=slide('Nueve riesgos orientan el diseño', 'Matriz resumida del modelo de amenazas R01–R09. Es una valoración cualitativa del prototipo y no una auditoría de cumplimiento. Las pruebas reproducen controles específicos y no eliminan los riesgos residuales. La evidencia y las limitaciones completas están en los documentos de riesgos y el handoff del repositorio.');
 table(s,[['Riesgo','Control o respuesta','Estado del prototipo'],['R01 · Autoridad de claves','Separación de secretos y ejecución','Pendiente en infraestructura'],['R02 · Cobro incierto','Bloqueo de reenvío y consulta','Parcial, estado aún en memoria'],['R03 · Monto o receptor','AEAD + validación de negocio','Implementado y probado'],['R04 · Replay y retorno','Request ID, estado GNAP y sesión','Implementado, alcance local'],['R05 · Wallet ajena','Perfil del servidor y propiedad','Pruebas con adaptadores'],['R06 · Claves falsas','Firma híbrida y claves esperadas','Raíz de confianza pendiente'],['R07 · Saturación','Límites de cuerpo y frecuencia','Sin prueba de carga completa'],['R08 · JS malicioso','Reducir confianza en el cliente','Riesgo residual'],['R09 · Descifrado futuro','ML-KEM en la capa de aplicación','Alcance navegador–pasarela']],64,160,1152,480,[330,440,382],21);
}
// 5. Criptografía del canal, formulación concreta.
{
 const s=slide('Canal de aplicación con ML-KEM-768', 'Fuentes: src/payments/pqc/channel.ts y NIST FIPS 203, https://csrc.nist.gov/pubs/fips/203/final . ML-KEM permite establecer un secreto compartido que después usa el cifrado simétrico. La implementación deriva claves diferentes para solicitud y respuesta mediante HKDF-SHA-256, con sal de 32 bytes a cero y dominio terracierta-pasarela-v1. La aplicación usa IV aleatorio de 12 bytes y tag GCM de 128 bits. Las fórmulas de esta lámina describen la composición real del código, sin presentar una construcción nueva ni una validación FIPS del módulo.');
 text(s,'Encapsulate(pk) = (ct, ss)',64,168,1120,54,35,C.forest,true);
 text(s,'Decapsulate(ct, sk) = ss',64,238,1120,54,35,C.forest,true);
 text(s,'Kreq  = HKDF-SHA-256(ss, dominio : request)',64,330,1120,45,29,C.copper);
 text(s,'Kresp = HKDF-SHA-256(ss, dominio : reply)',64,385,1120,45,29,C.copper);
 text(s,'C, tag = AES-256-GCM(K, IV, mensaje, AAD)',64,475,1130,50,33,C.forest,true);
 text(s,'AAD vincula ruta, dirección, request ID, clave y tiempo.\nIV de 96 bits. Tag de autenticación de 128 bits.',64,559,1140,76,25,C.muted);
}
// 6. Firmas y lógica de aceptación.
{
 const s=slide('Un recibo exige ambas firmas y el negocio correcto', 'Fuentes de código: src/payments/pqc/hybridReceipt.ts, src/payments/gatewayClient.ts, src/payments/checkoutClient.ts. Referencia normativa: https://csrc.nist.gov/pubs/fips/204/final . La firma ML-DSA-65 añade integridad poscuántica al recibo mientras se conserva Ed25519. La política exige las dos, además de comparar monto, receptor y demás datos de negocio esperados. La serialización usa el orden estable del JSON del proyecto y no se anuncia como RFC 8785/JCS. No afirmamos certificación FIPS ni no repudio legal independiente de la custodia de claves.');
 const payload=node(s,'Documento\nJSON estable',64,220,280,110);
 const ed=node(s,'Ed25519\nverifica',520,160,300,100);
 const ml=node(s,'ML-DSA-65\nverifica',520,330,300,100,true);
 const accepted=node(s,'Aceptación',970,245,240,100);
 connect(s,payload,ed);connect(s,payload,ml);connect(s,ed,accepted);connect(s,ml,accepted);
 text(s,'Aceptar = Ed válida ∧ ML-DSA válida ∧ negocio coincide',64,500,1152,58,34,C.forest,true);
 text(s,'Claves públicas y firmas medidas en bytes',64,584,1152,36,24,C.muted);
 text(s,'Ed25519: 32 / 64         ML-DSA-65: 1952 / 3309',64,626,1152,34,24,C.copper);
}
// 7. Medición contra supuesto de amenaza.
{
 const s=slide('El escudo compara resultados reproducibles', 'Fuentes: src/payments/pqcQuantumDemo.ts, pqcChannelDemo.ts y sus pruebas. El laboratorio crea claves aleatorias reales y documentos sintéticos por corrida. El mismo documento permanece al alternar la política. Para representar un compromiso clásico, concede deliberadamente su propia clave efímera ECDH o su clave Ed25519 al atacante. No recupera claves públicas desconocidas ni ejecuta Shor sobre Ed25519/P-256. El fallo con una clave ajena demuestra separación de claves y no constituye una prueba experimental de seguridad cuántica.');
 table(s,[['Experimento','Cálculo real','Supuesto explícito'],['Confidencialidad','ECDH y ML-KEM, AES-GCM\nIda y vuelta y bit alterado','El atacante obtiene la\nclave ECDH de prueba'],['Integridad','Receptor modificado y firma Ed\nML-DSA detecta la alteración','El atacante obtiene la\nclave Ed25519 de prueba']],64,173,1152,294,[260,490,402],25);
 text(s,'Claves nuevas. Mismo caso al cambiar el escudo.',64,514,1152,50,31,C.forest,true);
 text(s,'El laboratorio muestra una consecuencia bajo un supuesto de compromiso.\nLa resistencia de los algoritmos requiere análisis criptográfico externo.',64,579,1140,74,25,C.muted);
}
// 8. Qiskit, mediciones originales editables.
{
 const data=JSON.parse(await fs.readFile(path.join(repo,'public/pqc/shor-demo.json'),'utf8'));
 const s=slide('Shor: una simulación pequeña con resultados reales', `Datos originales: public/pqc/shor-demo.json, generado ${data.generatedAt}. Script scripts/quantum/shor_demo.py, SHA-256 ${data.sourceSha256}. Qiskit ${data.qiskitVersion}, Python ${data.pythonVersion}, seed ${data.seed}. Fuente metodológica: https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm . Simulación ideal local de vector de estado, sin equipo cuántico IBM. N=15, base=2, 12 qubits lógicos, 4096 shots. La distribución permite recuperar orden r=4 y factores 3 y 5. No extrapolar a RSA-2048 ni Ed25519. El circuito de unidad densa no escala. No prueba la resistencia de ML-KEM o ML-DSA.`);
 const chart=s.charts.add('bar',{position:{left:64,top:173,width:680,height:375},categories:['0','1/4','1/2','3/4'],series:[{name:'Mediciones',values:[988,1005,1024,1079],fill:C.forest}],hasLegend:false,barOptions:{direction:'column',gapWidth:100},xAxis:{textStyle:{fontSize:23,fill:C.ink},line:{fill:C.line,width:1}},yAxis:{min:0,max:1200,majorUnit:400,numberFormatCode:'0',textStyle:{fontSize:20,fill:C.muted},majorGridlines:{fill:C.line,width:1}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0',textStyle:{fontSize:23,fill:C.ink,bold:true}},chartFill:C.cream,plotAreaFill:C.cream});
 applyPresentationChartFont(chart,{fontFamily:FONT,availableFonts:[FONT,DISPLAY]});
 text(s,'N = 15   a = 2\nr = 4\ngcd(2² ± 1, 15)\n= 3 y 5',800,187,400,230,31,C.forest,true);
 text(s,'12 qubits lógicos\n4096 mediciones',800,447,400,90,26,C.copper);
 text(s,'Simulador local ideal. Este caso educativo no ataca una clave de producción.',64,595,1140,65,27,C.muted);
}
// 9. Evidencia y herramientas.
{
 const s=slide('La evidencia acompaña a la animación', 'Fuentes: scripts/verify-pqc-native.mjs, src/payments/pqcChannelDemo.test.ts, pqcQuantumDemo.test.ts, checkout.integration.test.ts y docs/verificacion-burp-pqc.md. Suite final confirmada: 188 pruebas aprobadas y 23 omitidas. Las pruebas automatizadas financieras usan SDK simulado. Además, el 17 de octubre de 2026 el titular aceptó una autorización GNAP fresca y el flujo autónomo del SDK real terminó en estado completado en testnet. La interfaz mostró recibo protegido verificado y envío y recepción comprobados. Débito: 1,05 EUR. Recepción: 0,05 EUR. No se atribuye la diferencia a una comisión concreta sin comprobar su causa. Este resultado no valida el flujo comercial con login o wallets COP. Verificador independiente con Node 26 y OpenSSL 3.6.4: 9 comprobaciones de interoperabilidad e integridad y dos límites observados de confianza y ciclo de claves. Evidencia mediante MCP de Burp Suite 1.1.2, get_proxy_http_history_regex, el 2026-10-17 a las 06:35:23 UTC: key 200, echo cifrado 200, echo con bit alterado 400. No se repitieron cobros desde Burp. La inspección de Burp no demuestra por sí sola resistencia a Shor.');
 text(s,'Código y pruebas automatizadas',64,174,660,54,32,C.forest,true);
 text(s,'188 pruebas pasan y 23 quedan omitidas.\nPago testnet completado con consentimiento.',64,241,660,100,27,C.muted);
 text(s,'Node + OpenSSL',64,378,660,54,32,C.forest,true);
 text(s,'9 comprobaciones de interoperabilidad.\n2 límites de confianza y ciclo de claves.',64,443,660,100,27,C.muted);
 text(s,'Burp Suite',825,174,380,54,32,C.copper,true);
 text(s,'MCP: key 200 y echo 200.\nEcho alterado: 400.\nSin repetir pagos.',825,241,380,160,27,C.muted);
 text(s,'Las pruebas verifican propiedades concretas. La suite no certifica toda la plataforma.',64,585,1140,70,27,C.forest);
}
// 10. Contrato con el login.
{
 const s=slide('El login entrega identidad. La pasarela aplica permisos', 'Fuente: docs/handoff-pasarela-login.md y src/auth/index.ts. La integración debe entregar el perfil validado desde el servidor con ID de usuario, rol y wallet asociada. El cliente no puede elegir su identidad por un selector ni imponer el receptor, precio o resultado. Comprador solo paga su orden, cooperativa su oferta y caficultor consulta cobros propios. Las claves privadas de Open Payments son de servidor y no se envían al frontend. La wallet del pagador mantiene la aprobación GNAP. El equipo de login debe instalar las dependencias del lockfile con npm ci, configurar secretos de servidor y ejecutar las comprobaciones documentadas.');
 const login=node(s,'Sesión validada\nPerfil del servidor',64,210,340,120);
 const policy=node(s,'Propiedad y rol\nMonto y receptor',470,210,340,120,true);
 const pay=node(s,'SDK oficial\nAutorización wallet',876,210,340,120);
 connect(s,login,policy);connect(s,policy,pay);
 text(s,'Perfil: usuario + rol + wallet',64,403,1150,54,34,C.forest,true);
 text(s,'La orden u oferta determina el precio y el destino en el servidor.\nEl caficultor recibe y consulta. El pagador autoriza el gasto.',64,478,1150,96,28,C.muted);
 text(s,'Integración reproducible: npm ci y el handoff técnico del repositorio',64,606,1150,43,25,C.copper);
}
// 11. Alcance y pendientes explícitos.
{
 const s=slide('Qué existe y qué requiere producción', 'Estado del prototipo según los documentos del proyecto. Existe canal ML-KEM de aplicación, recibos híbridos, SDK Open Payments, laboratorio y controles de negocio con pruebas. El flujo autónomo con SDK real completó un pago de testnet después del consentimiento GNAP humano el 17 de octubre de 2026. Pendientes: login comercial real del equipo, wallets compatibles con la moneda de la orden (no conversión COP/EUR inventada), almacenamiento duradero de estado/continuaciones de grants, claves persistentes con rotación y raíz de confianza, separación de ejecución/custodia y despliegue HTTPS. Noble usa JavaScript y la integración no constituye validación FIPS ni certificación PCI DSS. Un Vault/HSM futuro requiere integración real, no solo instalar un servicio. No se afirma secreto hacia adelante tras compromiso de la clave ML-KEM de larga duración.');
 text(s,'Implementado',64,175,510,54,34,C.forest,true);
 text(s,'Canal ML-KEM y AES-GCM\nRecibos Ed25519 + ML-DSA\nControles de negocio y GNAP\nPago autónomo testnet completado\nLaboratorio verificable',64,251,520,235,29,C.ink);
 text(s,'Pendiente de integración e infraestructura',676,175,540,90,32,C.copper,true);
 text(s,'Login real y wallets compatibles\nEstado durable de pagos y grants\nCustodia, rotación y raíz de claves\nHTTPS y operación del servicio',676,288,540,225,29,C.ink);
 text(s,'Algoritmos estandarizados por NIST. Esta implementación no posee certificación FIPS ni PCI DSS.',64,593,1152,69,26,C.muted);
}
// 12. Cierre de demo y propuesta.
{
 const s=slide('La demostración para el jurado', 'Guion sugerido, alrededor de 90 segundos. Mostrar /pago/pasarela para la experiencia simple por rol. Abrir /pago/seguridad, ejecutar laboratorio y alternar los escudos de canal y firma conservando el mismo caso. Abrir evidencia, mostrar el resultado de alteración, los parámetros medidos y una prueba en Burp únicamente con key/echo. Si hay una sesión y transacción comercial válidas, mostrar el flujo de consentimiento sin repetir ni ejecutar pagos desde Burp. Si el login aún no está integrado, decirlo. Cerrar con el alcance real de PQC y los pendientes, sin prometer seguridad absoluta.');
 text(s,'Una pasarela simple para quien compra café',64,174,1135,56,35,C.forest,true);
 text(s,'Un laboratorio que explica el riesgo y permite repetir la prueba',64,253,1135,86,32,C.ink);
 text(s,'Una evidencia verificable de cifrado, firmas y validación',64,359,1135,88,32,C.ink);
 text(s,'/pago/pasarela\n/pago/seguridad',64,488,1140,95,32,C.copper);
 text(s,'La innovación une una amenaza futura con controles actuales y límites comprobables.',64,611,1152,49,27,C.forest);
}

for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i];
 const png=await p.export({slide:s,format:'png',scale:1});
 await fs.writeFile(path.join(workspaceDir,`preview/slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:'layout'});await fs.writeFile(path.join(workspaceDir,`.build/slide-${i+1}.json`),await layout.text());
}
// El exportador PDF del runtime falla con un alias de fuentes estándar ausente.
// La vista PDF conserva exactamente las láminas renderizadas; el PPTX conserva
// los objetos editables, tablas, gráfico y notas de fuente.
const pdf=await PDFDocument.create();
pdf.setTitle('TerraCierta · Pagos con evidencia postcuántica');pdf.setLanguage('es');
for(let i=1;i<=p.slides.items.length;i++){const page=pdf.addPage([1280,720]);const png=await pdf.embedPng(await fs.readFile(path.join(workspaceDir,`preview/slide-${String(i).padStart(2,'0')}.png`)));page.drawImage(png,{x:0,y:0,width:1280,height:720});}
await fs.writeFile(path.join(workspaceDir,'entrega/terracierta-pqc.pdf'),await pdf.save());
const montage=await p.export({format:'webp',montage:true});
await fs.writeFile(path.join(workspaceDir,'preview/vista-general.webp'),new Uint8Array(await montage.arrayBuffer()));
const candidatePath=path.join(workspaceDir,'.build/draft.pptx');
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const finalPath=path.join(workspaceDir,`entrega/terracierta-pqc-${Date.now()}.pptx`);
const result=await finalizePresentation({workspaceDir,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','4','--require-native-table-slide','7'],fontPolicy:{basis:'design',families:[FONT,DISPLAY]},explicitTotalSlideCount:12,requiredNativeTableOwnerSlides:[4,7],requiredNativeChartOwnerSlides:[8],materializeLiteralChartWorkbooks:true,verifyArtifactToolImport:true,receiptPath:path.join(workspaceDir,`.build/validation-${Date.now()}.json`)});
console.log(JSON.stringify({finalPath,result}));
