export interface IImageServicePort {
    readImageAsBase64(filePathOrUrl: string): Promise<string>;
}
