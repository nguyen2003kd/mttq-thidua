import { type AxiosRequestConfig } from 'axios';
import { mainInstance } from '@/api/mutator/custom-instance';
import type { FileItemApi } from '@/features/files/api/filesApi';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: Array<{ messages?: { vi?: string; en?: string } }>;
}

const request = async <T>(config: AxiosRequestConfig) => {
  const response = await mainInstance<ApiEnvelope<T>>(config);
  return response.data;
};

export interface ResultPublicationLocality {
  wardCode: string;
  wardName: string;
  status: 'NotSubmitted' | 'RequiresRevision' | 'ReviewerApproved' | 'CouncilApproved' | 'CommitteeFinalized' | 'InProgress';
  submissionId: string | null;
  currentPoint: number;
  maxPoint: number;
  hasData: boolean;
}

export interface ResultPublicationCriteriaGroup {
  criteriaGroupId: string;
  name: string;
  maxPoint: number;
  criteriaCount: number;
  totalLocalities: number;
  localitiesWithData: number;
  localitiesCompleted: number;
  localitiesRequiresRevision: number;
  localitiesNotSubmitted: number;
  localitiesInProgress: number;
  totalCurrentPoint: number;
  totalMaxPoint: number;
  localities: ResultPublicationLocality[];
}

export interface ResultPublicationOverview {
  periodId: string;
  periodName: string;
  totalLocalities: number;
  localitiesWithData: number;
  localitiesCompleted: number;
  localitiesRequiresRevision: number;
  localitiesNotSubmitted: number;
  totalCurrentPoint: number;
  totalMaxPoint: number;
  completionRate: number;
  isPublished: boolean;
  publishedBy: string | null;
  publishedByName: string | null;
  publishedAt: string | null;
  criteriaGroups: ResultPublicationCriteriaGroup[];
}

export interface UnpublishedLocalityGroup {
  wardCode: string;
  wardName: string;
  criteriaGroupId: string;
  criteriaGroupName: string;
}

export interface ResultPublicationPreview {
  periodId: string;
  periodName: string;
  canPublish: boolean;
  isPublished: boolean;
  totalLocalities: number;
  localitiesNotSubmitted: number;
  localitiesRequiresRevision: number;
  message: string;
  publishedAt: string | null;
  unpublishedLocalityGroups: UnpublishedLocalityGroup[];
}

export interface ResultPublicationResult {
  periodId: string;
  periodName: string;
  publicationId: string;
  published: boolean;
  publishedBy: string;
  publishedAt: string;
  finalizedSubmissionCount: number;
  notifiedUserCount: number;
}

export interface LocalResultPublicationGroup {
  criteriaGroupId: string;
  name: string;
  currentPoint: number;
  maxPoint: number;
  status: ResultPublicationLocality['status'];
  submissionId: string | null;
}

export interface LocalResultPublication {
  periodId: string;
  periodName: string;
  publicationId: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  publicationNote: string | null;
  localityName: string | null;
  rank: number | null;
  rankTotal: number;
  files: FileItemApi[];
  criteriaGroups: LocalResultPublicationGroup[];
}

export const resultPublicationApi = {
  getOverview: (periodId: string) => request<ResultPublicationOverview>({ url: '/api/v1/result-publications/overview', method: 'GET', params: { periodId } }),
  getCriteriaGroups: (periodId: string) => request<ResultPublicationCriteriaGroup[]>({ url: '/api/v1/result-publications/criteria-groups', method: 'GET', params: { periodId } }),
  getCriteriaGroup: (id: string, periodId: string) => request<ResultPublicationCriteriaGroup>({ url: `/api/v1/result-publications/criteria-groups/${id}`, method: 'GET', params: { periodId } }),
  getPreview: (periodId: string) => request<ResultPublicationPreview>({ url: '/api/v1/result-publications/preview', method: 'GET', params: { periodId } }),
  publish: (periodId: string, note?: string, file?: File | null) => {
    const form = new FormData();
    form.append('periodId', periodId);
    form.append('note', note?.trim() || '');
    if (file) form.append('file', file);

    return request<ResultPublicationResult>({
      url: '/api/v1/result-publications/publish',
      method: 'POST',
      data: form,
    });
  },
  getLocalResult: (periodId: string) => request<LocalResultPublication>({ url: '/api/v1/result-publications/local', method: 'GET', params: { periodId } }),
};
