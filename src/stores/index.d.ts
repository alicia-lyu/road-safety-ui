
// index of safety or congestion
export interface IndexStoreState {
    Segments: SegmentWithIndex[]
}

export interface SegmentWithIndex {
    coordinates: number[][],
    index: number
}