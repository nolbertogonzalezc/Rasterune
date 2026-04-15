import type { ConversionInput, ConversionResult } from './contracts';
import { GoogleSquooshAdapter } from './googleSquooshAdapter';

export class BrowserConversionWorker {
  private readonly adapter = new GoogleSquooshAdapter();

  async convert(input: ConversionInput): Promise<ConversionResult> {
    return this.adapter.convertImage(input);
  }
}
