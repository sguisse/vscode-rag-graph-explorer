// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from '@/services/abstract-api.service';
import type { MMAssessmentsReport, MMAssessmentsResult } from '@/shared/services/maturity-matrix/model/index';
import { IMaturityMatrixServicePort } from '@/shared/services/maturity-matrix/port-out/maturity-matrix-service.port';

class MaturityMatrixApiService extends AbstractApiService implements IMaturityMatrixServicePort {
    constructor() {
        super();
    }

    public async refreshAssessments(): Promise<MMAssessmentsReport> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_REFRESH_ASSESSMENTS);
    }

    public async getLastAssessments(): Promise<MMAssessmentsResult> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_LAST_ASSESSMENTS);
    }

    public async getAssessmentsAt(datetimeExtract: string): Promise<MMAssessmentsResult> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_ASSESSMENTS_AT, datetimeExtract);
    }

    public async getAssessmentsAvailable(): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_ASSESSMENTS_AVAILABLE);
    }
}

export const maturityMatrixApiService = new MaturityMatrixApiService();
