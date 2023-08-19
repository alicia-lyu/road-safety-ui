import { Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Stroke, Style } from 'ol/style'
import Feature, { FeatureLike } from 'ol/Feature'
import { LineString } from 'ol/geom'
import { PathWithSafety } from '@/stores/SafetyStore'

const safetyPathsLayerKey = 'safetyPathsLayer'
const selectedSafetyPathLayerKey = 'selectedSafetyPathLayer'

// Copied from UsePathsLayer.tsx
// Code related to accessNetworkLayer deleted, might have backlash
export default function useSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    useEffect(() => {
        console.log("Safety Paths", paths)
        removeCurrentSafetyPathLayers(map)
        addSafetyPathsLayer(
            map,
            paths
        )
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

function addSafetyPathsLayer(map: Map, paths: PathWithSafety[]) {
    const features = createSegments(paths)
    const layer = new VectorLayer({
        source: new VectorSource({
            features: features
        }),
        style: createStyleFunction,
        opacity: 0.5,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(1.1)
    map.addLayer(layer)
}

function createSegments(paths: PathWithSafety[]) {
    const segmentFeatures: Feature[] = [];
    paths.forEach(path => {
        path.segments.forEach(segment => {
            const geometry = new LineString(segment.coordinates)
            const feature = new Feature({
                geometry: geometry,
                safety: segment.index
            })
            segmentFeatures.push(feature)
        })
    })
   return segmentFeatures
}

function createStyleFunction(feature: FeatureLike, resolution: number) {
    const safetyScore = feature.getProperties().safety
    const color = `[255, 69, 58, ${(5 - safetyScore) / 5}]`
    const style = new Style({
        stroke: new Stroke({
            color: color,
            width: 6,
            lineCap: 'square',
            lineJoin: 'round',
        }),
    })
    return style
}