import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import axios from 'axios';

const { convertMapUrlToPoint } = require('gmaps-expand-shorturl');

export class GmapsCoordinatesExtractor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gmaps - Coordinates Extractor',
		name: 'gmapsCoordinatesExtractor',
		group: ['transform'],
		version: 1,
		description: 'Obtiene coordenadas a partir de URLs cortas de Google Maps',
		defaults: {
			name: 'Gmaps - Coordinates Extractor',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'URL De Google Maps',
				name: 'mapUrl',
				type: 'string',
				default: '',
				placeholder: 'https://maps.app.goo.gl/FCZu934XxfNg12dk7',
				description: 'La URL acortada de Google Maps para extraer coordenadas',
			},
		],
	};

	/**
	 * Método privado que extrae las coordenadas de una URL corta de Google Maps.
	 * Se puede usar dentro del nodo o probarse de forma independiente.
	 *
	 * @param {string} mapUrl - URL de Google Maps.
	 * @returns {Promise<{ latitude: number; longitude: number }>} - Coordenadas extraídas.
	 */
	public async extractCoordinates(
		mapUrl: string,
	): Promise<{ latitude: number; longitude: number }> {
		try {
			console.log('🌍 Procesando URL:', mapUrl);

			// 1. Intentar extraer desde el HTML
			const response = await axios.get(mapUrl);
			console.log('📡 Respuesta HTTP recibida');

			const html: string = response.data;
			const regex =
				/<meta content="https:\/\/maps\.google\.com\/maps\/api\/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/;
			const match = html.match(regex);

			let latitude: number;
			let longitude: number;

			if (match) {
				latitude = parseFloat(match[1]);
				longitude = parseFloat(match[2]);
				console.log('✅ Coordenadas extraídas del HTML:', { latitude, longitude });
			} else {
				console.log('⚠️ No se encontraron coordenadas en el HTML, usando fallback...');
				const pointLatLong = await convertMapUrlToPoint(mapUrl);
				latitude = parseFloat(pointLatLong.latitude);
				longitude = parseFloat(pointLatLong.longitude);
				console.log('✅ Coordenadas obtenidas con la librería:', { latitude, longitude });
			}

			return { latitude, longitude };
		} catch (error) {
			console.error('❌ Error al extraer coordenadas:', error);
			throw error;
		}
	}

	/**
	 * Método que se ejecuta en n8n cuando se usa este nodo.
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const mapUrl = this.getNodeParameter('mapUrl', itemIndex) as string;
				console.log('🔹 Ejecutando nodo con URL:', mapUrl);

				// Llamamos al método privado para extraer coordenadas
				const { latitude, longitude } = await (
					this as unknown as GmapsCoordinatesExtractor
				).extractCoordinates(mapUrl);

				returnData.push({
					json: {
						latitude,
						longitude,
					},
				});
			} catch (error) {
				console.error('❌ Error procesando la URL en n8n:', error);
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
