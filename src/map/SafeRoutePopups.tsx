import SafetyPopup from "@/layers/SafetyPopup";
import { SafetyFeatureStoreState } from "@/stores/SafetyFeatureStore";
import { Map } from "ol";

interface SafetyPopupProps {
    map: Map,
    safetyFeatures: SafetyFeatureStoreState
}


export default function SafeRoutePopups({ map, safetyFeatures }: SafetyPopupProps) {
    return (
        <>
            <SafetyPopup
                map={map}
                safetyScore={safetyFeatures.safetyScore}
                explanationProperties={safetyFeatures.explanationProperties}
                coordinate={safetyFeatures.coordinate}
            />
        </>
    )
}