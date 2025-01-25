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
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'URL de Google Maps',
				name: 'mapUrl',
				type: 'string',
				default: '',
				placeholder: 'https://maps.app.goo.gl/FCZu934XxfNg12dk7',
				description: 'La URL acortada de Google Maps para extraer coordenadas',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const mapUrl = this.getNodeParameter('mapUrl', itemIndex) as string;
				const response = await axios.get(mapUrl);
				const html = response.data as string;
				const regex =
					/<meta content="https:\/\/maps\.google\.com\/maps\/api\/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/;
				const match = html.match(regex);

				let latitude: number;
				let longitude: number;

				if (match) {
					// Si existe match, extraemos los grupos capturados
					latitude = parseFloat(match[1]);
					longitude = parseFloat(match[2]);
				} else {
					// 3. Si no encontramos la coordenada en el HTML,
					//    usamos la librería gmaps-expand-shorturl como fallback
					const pointLatLong = await convertMapUrlToPoint(mapUrl);

					latitude = parseFloat(pointLatLong.latitude);
					longitude = parseFloat(pointLatLong.longitude);
				}

				returnData.push({
					json: {
						latitude,
						longitude,
					},
				});
				return [returnData];
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
