import { Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { FeatureCollection } from 'geojson'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'

const safetyPathsLayerKey = 'safetyPathsLayer'
const selectedSafetyPathLayerKey = 'selectedSafetyPathLayer'

// Copied from UsePathsLayer.tsx
// Code related to accessNetworkLayer deleted, might have backlash
export default function useSafetyPathsLayer(map: Map, paths: Path[], selectedPath: Path) {
    useEffect(() => {
        removeCurrentSafetyPathLayers(map)
        addUnselectedSafetyPathsLayer(
            map,
            paths.filter(p => p != selectedPath)
        )
        addSelectedSafetyPathsLayer(map, selectedPath)
        return () => {
            removeCurrentSafetyPathLayers(map)
        }
    }, [map, paths, selectedPath])
}

function removeCurrentSafetyPathLayers(map: Map) {
    map.getLayers()
        .getArray()
        .filter(l => l.get(safetyPathsLayerKey) || l.get(selectedSafetyPathLayerKey))
        .forEach(l => map.removeLayer(l))
}

function addUnselectedSafetyPathsLayer(map: Map, paths: Path[]) {
    const style = new Style({
        stroke: new Stroke({
            color: '#d70015',
            width: 5,
            lineCap: 'round',
            lineJoin: 'round',
        }),
    })
    const layer = new VectorLayer({
        source: new VectorSource({
            features: new GeoJSON().readFeatures(createUnselectedPaths(paths)),
        }),
        style: () => style,
        opacity: 1,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(1.1)
    map.addLayer(layer)
}

function addSelectedSafetyPathsLayer(map: Map, selectedPath: Path) {
    const style = new Style({
        stroke: new Stroke({
            color: '#ff3a30',
            width: 6,
            lineCap: 'round',
            lineJoin: 'round',
        }),
    })
    const layer = new VectorLayer({
        source: new VectorSource({
            features: new GeoJSON().readFeatures(createSelectedPath(selectedPath)),
        }),
        style: () => style,
        opacity: 1,
    })
    layer.set(selectedSafetyPathLayerKey, true)
    layer.setZIndex(2.1)
    map.addLayer(layer)
}

function createUnselectedPaths(paths: Path[]) {
    const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: paths.map((path, index) => {
            return {
                type: 'Feature',
                properties: {
                    index,
                },
                geometry: {
                    ...path.points,
                    coordinates: path.points.coordinates.map(c => fromLonLat(c)),
                },
            }
        }),
    }
    return featureCollection
}

function createSelectedPath(path: Path) {
    const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    ...path.points,
                    coordinates: path.points.coordinates.map(c => fromLonLat(c)),
                },
            },
        ],
    }
    return featureCollection
}