
export interface IUrlServicePort {
    readUrlContent(url: string): Promise<string>;
}
