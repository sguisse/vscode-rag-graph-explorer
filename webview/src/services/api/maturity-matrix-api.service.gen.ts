// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from '@/services/abstract-api.service';
import type { AssessmentsPyReport, AssessmentsPyResult } from '@/shared/services/maturity-matrix/model/index';
import { MaturityMatrixData } from '@/shared/services/maturity-matrix/model/assessments-json';
import { IMaturityMatrixServicePort } from '@/shared/services/maturity-matrix/port-out/maturity-matrix-service.port';

class MaturityMatrixApiService extends AbstractApiService implements IMaturityMatrixServicePort {
    constructor() {
        super();
    }

    public async refreshAssessments(): Promise<AssessmentsPyReport> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_REFRESH_ASSESSMENTS);
    }

    public async getLastAssessments(): Promise<MaturityMatrixData> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_LAST_ASSESSMENTS);
    }

    public async getAssessmentsAt(datetimeExtract: string): Promise<MaturityMatrixData> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_ASSESSMENTS_AT, datetimeExtract);
    }

    public async getAssessmentsAvailable(): Promise<string[]> {
        return await this.rpc.call(RpcMethodEnum.MATURITYMATRIX_GET_ASSESSMENTS_AVAILABLE);
    }
}

export const maturityMatrixApiService = new MaturityMatrixApiService();
