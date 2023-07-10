import { Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { FeatureCollection } from 'geojson'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import Feature, { FeatureLike } from 'ol/Feature'
import { Geometry, LineString } from 'ol/geom'

const safetyPathsLayerKey = 'safetyPathsLayer'
const selectedSafetyPathLayerKey = 'selectedSafetyPathLayer'
const safetyScoreToColors = [
    '#f63428',
    '#ff8c00',
    '#ffcc00',
    '#02d46a',
]

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
    const features = new GeoJSON().readFeatures(createUnselectedPaths(paths))
    const fragmentedFeatures = fragmentFeatures(features)
    const layer = new VectorLayer({
        source: new VectorSource({
            features: fragmentedFeatures
        }),
        style: createStyleFunction,
        opacity: 0.5,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(1.1)
    map.addLayer(layer)
}

function addSelectedSafetyPathsLayer(map: Map, selectedPath: Path) {
    const features = new GeoJSON().readFeatures(createSelectedPath(selectedPath))
    const fragmentedFeatures = fragmentFeatures(features)
    const layer = new VectorLayer({
        source: new VectorSource({
            features: fragmentedFeatures
        }),
        style: createStyleFunction,
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

function createStyleFunction(feature: FeatureLike, resolution: number) {
    const randomSafetyScore = Math.floor(Math.random() * 4)
    const style = new Style({
        stroke: new Stroke({
            color: safetyScoreToColors[randomSafetyScore],
            width: 6,
            lineCap: 'square',
            lineJoin: 'round',
        }),
    })
    return style
}

/**
 * 
 * Breaks down @param features with LineString geometry
 * @returns smaller LineString features
 */
function fragmentFeatures(features: Feature<Geometry>[]) {
    const fragmentedFeatures: Feature<Geometry>[] = []
    features.forEach(f => {
        const geometry = f.getGeometry()
        if (!(geometry instanceof LineString)) {
            fragmentedFeatures.push(f)
        }
        const lineString = geometry as LineString
        lineString.forEachSegment((start, end) => {
            const fragment = new LineString([start, end])
            const feature = new Feature(fragment)
            fragmentedFeatures.push(feature)
        })
    })
    return fragmentedFeatures
}