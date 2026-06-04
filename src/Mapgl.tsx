import { useEffect } from 'react';
import { load } from '@2gis/mapgl';
import { useMapglContext } from './MapglContext';
import { Clusterer } from '@2gis/mapgl-clusterer';
import { RulerControl } from '@2gis/mapgl-ruler';
import { Directions } from '@2gis/mapgl-directions';
import { useControlRotateClockwise } from './useControlRotateClockwise';
import { ControlRotateCounterclockwise } from './ControlRotateConterclockwise';
import { MapWrapper } from './MapWrapper';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import geoData from './data/irkutskaia-oblast.json';

export const MAP_CENTER = [104.2964, 52.2978];

export default function Mapgl() {
    const { setMapglContext } = useMapglContext();

    useEffect(() => {
        let map: mapgl.Map | undefined = undefined;
        let directions: Directions | undefined = undefined;
        let clusterer: Clusterer | undefined = undefined;

        load().then((mapgl) => {
            map = new mapgl.Map('map-container', {
                center: MAP_CENTER,
                zoom: 13,
                key: '649a0d31-f13d-4dc7-b9bd-8c06e7390c4f',
                style: '7b540eca-ce52-44a9-b84c-fdc8543ccad9',
                //                style: '3ab96106-8f64-42b7-ba6b-7035e12b12d2', //2gis
                //  style: '8c3e5ff3-bff3-4064-a574-bd6fddb0ffe0', //6лб
                maxPitch: 70,
                lowZoomMaxPitch: 45,
            });

            map.on('click', (e) => console.log(e));

            /**
             * Индивидуальное задание №3
             */
            map.patchStyleState({ globeEnabled: true });
            map.patchStyleState({ immersiveRoadsOn: true });

            // Пробки через DOM-кнопку
            const trafficToggle = document.getElementById('traffic-toggle');
            trafficToggle?.addEventListener('click', () => {
                if ((map as any).isTrafficOn()) {
                    (map as any).hideTraffic();
                } else {
                    (map as any).showTraffic();
                }
            });

            /**
             * Ruler plugin
             */
            const rulerControl = new RulerControl(map, { position: 'centerRight' });

            /**
             * Clusterer plugin
             */
            clusterer = new Clusterer(map, {
                radius: 60,
            });

            const markers = [
                { coordinates: [55.27887, 25.21001] },
                { coordinates: [55.30771, 25.20314] },
                { coordinates: [55.35266, 25.24382] },
            ];
            clusterer.load(markers);

            /**
             * Directions plugin
             */
            directions = new Directions(map, {
                directionsApiKey: 'rujany4131',
            });

            directions.carRoute({
                points: [
                    [55.28273111108218, 25.234131928828333],
                    [55.35242563034581, 25.23925607042088],
                ],
            });

            /**
             * GeoJSON данные
             */
            const rawData = geoData as FeatureCollection<Geometry, GeoJsonProperties>;

            const data: FeatureCollection<Geometry, GeoJsonProperties> = {
                type: 'FeatureCollection',
                features: rawData.features.filter((f) => f.geometry !== null),
            };

            // Источник для точек с подписями
            new mapgl.GeoJsonSource(map, {
                data,
                attributes: {
                    purpose: 'points',
                },
            });

            // Источник для тепловой карты
            new mapgl.GeoJsonSource(map, {
                data,
                attributes: {
                    purpose: 'heatmap',
                },
            });

            /**
             * Слой точек с подписями
             */
            const pointsLayer: any = {
                id: 'dtp-points-layer',
                filter: [
                    'match',
                    ['sourceAttr', 'purpose'],
                    ['points'],
                    true,
                    false,
                ],
                type: 'point',
                style: {
                    iconImage: 'marker',
                    iconWidth: 15,
                    textField: ['get', 'severity'],
                    textFont: ['Noto_Sans'],
                    textColor: '#672044',
                    textHaloColor: '#FFC6C4',
                    textHaloWidth: 1,
                    iconPriority: 100,
                    textPriority: 100,
                },
            };

            /**
             * Тепловая карта
             */
            const heatmapLayer: any = {
                id: 'dtp-heatmap-layer',
                filter: [
                    'match',
                    ['sourceAttr', 'purpose'],
                    ['heatmap'],
                    true,
                    false,
                ],
                type: 'heatmap',
                style: {
                    color: [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0,   'rgba(0, 0, 0, 0)',
                        0.2, 'rgba(255, 198, 196, 1)',
                        0.4, 'rgba(204, 96, 125, 1)',
                        0.6, 'rgba(173, 70, 108, 1)',
                        0.8, 'rgba(139, 48, 88, 1)',
                        1,   'rgba(103, 32, 68, 1)',
                    ],
                    radius: 20,
                    intensity: 0.8,
                    opacity: 0.8,
                    downscale: 1,
                },
            };

            map.on('styleload', () => {
                map?.addLayer(pointsLayer);
                map?.addLayer(heatmapLayer);
            });

            setMapglContext({
                mapglInstance: map,
                rulerControl,
                mapgl,
            });
        });

        return () => {
            directions && directions.clear();
            clusterer && clusterer.destroy();
            map && map.destroy();
            setMapglContext({ mapglInstance: undefined, mapgl: undefined });
        };
    }, [setMapglContext]);

    useControlRotateClockwise();

    return (
        <>
            <MapWrapper />
            <ControlRotateCounterclockwise />
            <button
                id="traffic-toggle"
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    padding: '8px 12px',
                    background: '#FFC6C4',
                    color: '#000',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                }}
            >
                Пробки
            </button>
        </>
    );
}