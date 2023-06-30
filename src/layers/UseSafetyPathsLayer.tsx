import { Feature, Map } from 'ol'
import { Path } from '@/api/graphhopper'
import { FeatureCollection } from 'geojson'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import Text from 'ol/style/Text.js'
import Overlay from 'ol/Overlay'


const safetyPathsLayerKey = 'safetyPathsLayer'
const selectedSafetyPathLayerKey = 'selectedSafetyPathLayer'
let rankList : number[] = []
let ratio = 0.5

export default function useSafetyPathsLayer(map: Map, paths: Path[], selectedPath: Path) {
  useEffect(() => {
    removeCurrentSafetyPathLayers(map)
    rankList = rankPaths(paths)
    addUnselectedSafetyPathsLayer(map, paths.filter(p => p !== selectedPath))
    addSelectedSafetyPathsLayer(map, selectedPath)
    return () => {
      removeCurrentSafetyPathLayers(map)
    }
  }, [map, paths, selectedPath])
  createSlider(map, paths)
}

function rankPaths(paths: Path[]) {
  const rankArray: number[] = [];
  let bestRank = 0;
  let bestPath: Path | null = null;

  paths.forEach((path) => {
    let feature = new GeoJSON().readFeatures(createSelectedPath(path))
    let averageNum = feature[0].getProperties().averageNumber
    let distance = path.distance
    if (averageNum !== undefined) {
      let rank = distance*0.5 + averageNum*0.5
      if (rank >= bestRank) {
        bestPath = path;
        bestRank = rank;
      }
      rankArray.push(rank);
    }
  });
  rankArray.sort((a, b) => b - a)
  console.log(rankArray)
  return rankArray;
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
    style: (feature) => {
      const segmentNumber = feature.get('segmentNumber')
      const color = getSafetyColor(segmentNumber)
      style.getStroke().setColor(color)
      return style
    },
    opacity: 1,
  })
  layer.set(safetyPathsLayerKey, true)
  layer.setZIndex(1.1)
  map.addLayer(layer)
}

function addSelectedSafetyPathsLayer(map: Map, selectedPath: Path) {
  const style = new Style({
    stroke: new Stroke({
      color: '#d70015',
      width: 14,
      lineCap: 'round',
      lineJoin: 'round',
    }),
    text: new Text({
      text: "",
      textAlign: 'center',
      textBaseline: 'middle',
      offsetY: -10,
      offsetX: 10,
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  })

  const selectedLayer = new VectorLayer({
    source: new VectorSource({
      features: new GeoJSON().readFeatures(createSelectedPath(selectedPath)),
    }),
    style: (feature) => {
      let numSelectedPath = selectedPath.distance*0.5+feature.get('averageNumber')*0.5
      let rank = 0
      rankList.forEach((num, index)=>{
        if(num==numSelectedPath){
          rank = index+1
        }
      })
      const segmentNumber = feature.get('segmentNumber')
      const color = getSafetyColor(segmentNumber)
      style.getText().setText(segmentNumber.toString() + ' (safe rank: ' + rank + ')');
      style.getStroke().setColor(color)
      return style
    },
    opacity: 1,
  })

 
  selectedLayer.set(safetyPathsLayerKey, true);
  selectedLayer.setZIndex(1.2);
  map.addLayer(selectedLayer);

}


function createUnselectedPaths(paths: Path[]) {
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: paths.flatMap((path) => {
      let coordinates = path.points.coordinates.map(c => fromLonLat(c))

      return coordinates.slice(0, -1).map((c, i) => {
        const segmentCoordinates = [c, coordinates[i + 1]]
        const segmentNumber = i % 6 // Assign a unique segment number to each segment
        return {
          type: 'Feature',
          properties: {
            segmentNumber: segmentNumber,
          },
          geometry: {
            type: 'LineString',
            coordinates: segmentCoordinates,
          },
        }
      })
    }),
  }
  return featureCollection
}

function createSelectedPath(path: Path) {
  const segmentCount = path.points.coordinates.length - 1;
  let sumSegmentNumber = 0;

  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: path.points.coordinates.slice(0, -1).map((c, i) => {
      const segmentCoordinates = [fromLonLat(c), fromLonLat(path.points.coordinates[i + 1])];
      const segmentNumber = i % 6; // Assign a unique segment number to each segment

      sumSegmentNumber += segmentNumber;

      return {
        type: 'Feature',
        properties: {
          segmentNumber: segmentNumber,
          averageNumber: 0, // Placeholder, will be updated later
          rank: 0,// Placeholder, will be updated later
        },
        geometry: {
          type: 'LineString',
          coordinates: segmentCoordinates,
        },
      };
    }),
  };

  // Calculate average number
  const averageNumber = segmentCount > 0 ? sumSegmentNumber / segmentCount : 0;

  // Update averageNumber property in each feature
  featureCollection.features.forEach((feature) => {
    if(feature.properties){
      feature.properties.averageNumber = averageNumber;
    }
  })
  return featureCollection;
}


function getSafetyColor(segmentNumber: number) {
  const colors = [
    '#ffa500', // Orange
    '#ffff00', // Yellow
    '#008000', // Green
    '#0000ff', // Blue
    '#800080', // Purple
  ]
  return colors[segmentNumber]
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = text;
  button.addEventListener('click', onClick);
  return button;
}

function createSlider(map:Map, paths:Path[]) {
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '1';
  slider.value = '0.2';
  slider.step = '0.1';
  slider.className = 'slider';

  const label = document.createElement('label');
  label.innerHTML = 'Slider';

  const selectButton = createButton('Select the top safe path', () => {
    
    paths.forEach(path=>{
      let feature = new GeoJSON().readFeatures(createSelectedPath(path))
      let averageNum = feature[0].getProperties().averageNumber
      let distance = path.distance
      let index = rankList.findIndex((num) => num === 0.5*averageNum+0.5*distance);
      if(index==0){
        addSelectedSafetyPathsLayer(map, path);
      }
    })
  });

  sliderContainer.appendChild(label);
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(selectButton);

  slider.addEventListener('input', (event) => {
    ratio = Number(slider.value);
    rankPaths(paths);
  });

  map.getViewport().appendChild(sliderContainer);
}
