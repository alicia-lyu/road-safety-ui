
// index of safety or congestion
export interface IndexStoreState {
    paths: PathWithIndex[]
}

export interface SegmentWithIndex {
    coordinates: number[][],
    index: number
}

export interface PathWithIndex {
    segments: SegmentWithIndex[],
    overAllIndex: number
}