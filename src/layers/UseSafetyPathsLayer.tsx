import { Map, MapBrowserEvent } from 'ol'
import { Path } from '@/api/graphhopper'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Stroke, Style } from 'ol/style'
import Feature, { FeatureLike } from 'ol/Feature'
import { Geometry, LineString } from 'ol/geom'
import { PathWithSafety } from '@/stores/SafetyStore'
import { fromLonLat, toLonLat } from 'ol/proj'
import Dispatcher from '@/stores/Dispatcher'
import { SafeRouteRover } from '@/actions/Actions'

const safetyPathsLayerKey = 'safetyPathsLayer'

// Copied from UsePathsLayer.tsx
// Code related to accessNetworkLayer deleted, might have backlash
export default function useSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    useEffect(() => {
        removeCurrentSafetyPathsLayers(map)
        addSafetyPathsLayer(
            map,
            paths,
            selectedPath
        )
        return () => {
            removeCurrentSafetyPathsLayers(map)
        }
    }, [map, paths, selectedPath])
}

function removeCurrentSafetyPathsLayers(map: Map) {
    map.getLayers()
        .getArray()
        .filter(l => l.get(safetyPathsLayerKey))
        .forEach(l => map.removeLayer(l))
}

function addSafetyPathsLayer(map: Map, paths: PathWithSafety[], selectedPath: Path) {
    const features = createSegments(pickSelectedPath(paths, selectedPath))
    const layer = new VectorLayer({
        source: new VectorSource({
            features: features
        }),
        style: createStyleFunction,
        opacity: 1,
    })
    layer.set(safetyPathsLayerKey, true)
    layer.setZIndex(3)
    map.addLayer(layer)
    addHoveringEffect(map, layer)
}

function addHoveringEffect(map: Map, layer: VectorLayer<VectorSource<Geometry>>) {
    map.on('pointermove', onHover)
    function onHover (e: MapBrowserEvent<UIEvent>) {
        const features = map.getFeaturesAtPixel(e.pixel, {
            layerFilter: l => l === layer,
            hitTolerance: 5,
        })
        if (features.length > 0) {
            const lonLat = toLonLat(e.coordinate)
            // we only display the properties of the first feature
            const featureProperties = features[0].getProperties()
            Dispatcher.dispatch(new SafeRouteRover({ lat: lonLat[1], lng: lonLat[0] }, featureProperties.safety, featureProperties.explanation));
        } else {
            Dispatcher.dispatch(new SafeRouteRover(null, 0, {}))
        }
    }
}



function pickSelectedPath(paths: PathWithSafety[], selectedPath: Path): PathWithSafety[] {
    return paths.filter(path => path.points == selectedPath.points)
}

function createSegments(paths: PathWithSafety[]) {
    const segmentFeatures: Feature<Geometry>[] = [];
    paths.forEach(path => {
        path.segments.forEach(segment => {
            const geometry = new LineString(segment.coordinates.map(
                coordinate => fromLonLat(coordinate)
            ))
            const feature = new Feature({
                geometry: geometry,
                safety: segment.index,
                explanation: generateExplanation(segment.index)
            })
            //feature.setStyle(createStyleFunction(feature, 100))
            segmentFeatures.push(feature)
        })
    })
    return segmentFeatures
}
function createStyleFunction(feature: FeatureLike, resolution: number) {
    const safetyScore = feature.getProperties().safety
    const color = `rgba(255, 69, 58, ${Math.max((3 - safetyScore) / 4, 0)}`
    // only safetyScore < 3 will show red
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

function generateExplanation(safetyScore: number): object {
    const accidentsPastYear = Math.floor((5 - safetyScore) * 3);
    const dangerousFactors = [
        'Slippery Road', 'Potholes', 'Uneven Road', 'Roadworks', 'Road Narrowing', 'Heavy Traffic',
        'Rainy Weather', 'Foggy Weather', 'Snowy Weather', 'Icy Weather'
    ];
    const selectedFactors = [];
    const numberOfFactors = 5 - safetyScore; // Select more factors for lower safety scores
    const confidence = Math.random();

    for (let i = 0; i < numberOfFactors; i++) {
        const randomIndex = Math.floor(Math.random() * dangerousFactors.length);
        selectedFactors.push(dangerousFactors[randomIndex]);
        dangerousFactors.splice(randomIndex, 1); // Remove selected factor from the pool
    }

    return {
        'Confidence': `${Math.floor(90 + confidence * 10)}%`,
        'Accidents in the past year': accidentsPastYear,
        'Dangerous factors': selectedFactors,
    }
}