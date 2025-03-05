import { GmapsCoordinatesExtractor } from './GmapsCoordinatesExtractor.node';

async function runTest() {
	const node = new GmapsCoordinatesExtractor(); // Instancia de la clase
	const testUrls = [
		'https://maps.app.goo.gl/sTxyxMTU2sjzABcf9', // 4.425100228744417, -75.2486753377904
		'https://maps.app.goo.gl/XzfNwkKiLE2WVyzs7', //4.4254607317958286, -75.23925875085422
		'https://maps.app.goo.gl/ngmCWSAmTfk2nNRRA', // 4.430683824586747, -75.2372139481319
		'https://maps.app.goo.gl/7QQUnmZNbHToct4e7', // 4.439012550281661, -75.18567983948299
		'https://maps.app.goo.gl/BGdkhcVRz4UAvoH6A', // 4.445416889923863, -75.2047182640908,
		'https://maps.app.goo.gl/PidSLuzZs9zbD25c9', // 4.4459464360834895, -75.20479707904266
	];

	for (const url of testUrls) {
		try {
			console.log(`🔹 Probando con URL: ${url}`);
			const result = await node['extractCoordinates'](url); // Llamando al método privado
			console.log('📌 Resultado:', result);
		} catch (error) {
			console.error('❌ Error en prueba:', error);
		}
	}
}

runTest();
