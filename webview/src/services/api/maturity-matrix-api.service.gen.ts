// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from '@/services/abstract-api.service';
import type { MaturityMatrixResult } from '@/shared/services/maturity-matrix/model';
import { IMaturityMatrixServicePort } from '@/shared/services/maturity-matrix/port-out/maturity-matrix-service.port';

class MaturityMatrixApiService extends AbstractApiService implements IMaturityMatrixServicePort {
    constructor() {
        super();
    }

    public async extractAssessments(): Promise<MaturityMatrixResult> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_EXTRACT_ASSESSMENTS);
    }

    public async extractMaturityMatrix(): Promise<MaturityMatrixResult> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_EXTRACT_MATURITY_MATRIX);
    }
}

export const maturityMatrixApiService = new MaturityMatrixApiService();
