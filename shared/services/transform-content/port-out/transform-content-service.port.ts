import { TransformerWorkflow, TransformationResult } from "../model/transform-content-model";

export interface ITransformContentServicePort {
    transform(workflow: TransformerWorkflow, content: string): Promise<TransformationResult>;
}
