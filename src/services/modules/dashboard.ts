import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// ============ Types ============

export interface DashboardPage {
  pageKey: string;
  title: string;
  description: string;
  displayOrder: number;
}

export interface DashboardBuilderPage {
  id: string;
  pageKey: string;
  title: string;
  description: string;
  displayOrder: number;
  active: boolean;
  roles: string[];
  filters: DashboardBuilderFilter[];
  widgets: DashboardBuilderWidget[];
}

export interface DashboardBuilderFilter {
  id: string;
  filterId: string;
  label: string;
  type: string;
  lookupSource?: string;
  required: boolean;
  defaultExpression: string;
  displayOrder: number;
}

export interface DashboardBuilderWidget {
  id: string;
  widgetId: string;
  title: string;
  type: string;
  size: string;
  position: number;
  locked: boolean;
  dataSource: string;
  dataConfig: Record<string, any>;
  actions: Record<string, any>;
  active: boolean;
  roles: string[];
}

export interface DashboardBuilderMeta {
  chartTypes: {
    value: string;
    requiredConfig: string[];
  }[];
  filterTypes: {
    value: string;
    requiresLookupSource: boolean;
  }[];
  widgetSizes: string[];
}

export interface DashboardQuerySet {
  id: string;
  presetId: string;
  title: string;
  description: string;
  datasetId: string;
  queryType: string;
  queryJson: Record<string, any>;
  sqlText: string;
  paramBindings: Record<string, any>;
  visualization: Record<string, any>;
  active: boolean;
}

export interface BIQueryPreset {
  id: string;
  name: string;
  datasetId: string;
  query: BIQueryRequest;
  visualization?: {
    type: string;
    config: Record<string, any>;
  };
  description?: string;
}

export interface SupportedFilter {
  id: string;
  label: string;
  type: string;
  lookupSource?: string;
  required: boolean;
  defaultValue: any;
}

export interface DashboardContext {
  page: string;
  supportedFilters: SupportedFilter[];
}

export interface WidgetAction {
  id: string;
  type: string;
  label: string;
  dataset?: string;
  preset?: string;
}

export interface CatalogWidget {
  widgetId: string;
  title: string;
  type: string;
  size: string;
  defaultPosition: number;
  locked: boolean;
  actions: WidgetAction[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  size: string;
  position: number;
  locked: boolean;
  data: any;
  actions: WidgetAction[];
  error?: string;
  visible?: boolean;
  dataConfig?: Record<string, any>;
}

export interface DashboardData {
  page: string;
  context: Record<string, any>;
  widgets: DashboardWidget[];
}

export interface WidgetPreference {
  widgetId: string;
  visible: boolean;
  position: number;
  size: string;
}

export interface DashboardPreferences {
  usingRoleDefault: boolean;
  widgets: WidgetPreference[];
}

export interface DrilldownRequest {
  actionId: string;
  context: Record<string, any>;
}

export interface DrilldownColumn {
  id: string;
  label: string;
  type: string;
}

export interface DrilldownResponse {
  title: string;
  type: string;
  columns: DrilldownColumn[];
  data: Record<string, any>[];
  totals?: Record<string, any>;
}

export interface UpdatePreferencesRequest {
  widgets: {
    widgetId: string;
    visible: boolean;
    position: number;
    size: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// BI Types
export interface BIDataset {
  datasetId: string;
  title: string;
  available: boolean;
}

export interface BIDatasetSchema {
  datasetId: string;
  title: string;
  dateFields: {
    id: string;
    type: string;
    granularities: string[];
  }[];
  dimensions: {
    id: string;
    type: string;
    filterable: boolean;
    groupable: boolean;
  }[];
  metrics: {
    id: string;
    type: string;
    aggregation: string;
    supportsDistribution: boolean;
  }[];
}

export interface BIQueryRequest {
  dateRange?: {
    field: string;
    from: string;
    to: string;
    granularity: string;
  };
  dimensions?: string[];
  metrics?: string[];
  filters?: {
    operator: string;
    conditions: {
      field: string;
      operator: string;
      value: any;
    }[];
  };
  comparison?: {
    mode: string;
  };
  topN?: {
    dimension: string;
    metric: string;
    limit: number;
    includeOthers: boolean;
  };
  sort?: {
    field: string;
    direction: string;
  }[];
  limit?: number;
  offset?: number;
  includeTotals?: boolean;
  visualization?: {
    type: string;
    config: Record<string, any>;
  };
}

export interface BIQueryResponse {
  meta: {
    dataset: string;
    queryTimeMs: number;
    rowCount: number;
    currency?: string;
    palette?: string[];
    comparisonMode?: string;
  };
  columns: DrilldownColumn[];
  data: Record<string, any>[];
  totals?: Record<string, any>;
}

export interface BIExportJob {
  id: string;
  jobRef: string;
  status: "pending" | "processing" | "completed" | "failed";
  format: string;
  progressPercent: number;
  rowCount: number;
  fileBytes: number;
  downloadUrl: string;
  errorMessage: string;
  createdAt: string;
  startedAt: string;
  completedAt: string;
}

export interface BIReport {
  id: string;
  name: string;
  datasetId: string;
  query: BIQueryRequest;
  visualization: {
    type: string;
    config: Record<string, any>;
  };
  visibility: "PRIVATE" | "ROLE" | "TENANT";
  visibilityRole?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  editable: boolean;
}

export interface CreateBIReportRequest {
  name: string;
  datasetId: string;
  query: BIQueryRequest;
  visualization: {
    type: string;
    config: Record<string, any>;
  };
  visibility: "PRIVATE" | "ROLE" | "TENANT";
  visibilityRole?: string;
}

export interface UpdateBIReportRequest {
  name?: string;
  datasetId?: string;
  query?: BIQueryRequest;
  visualization?: {
    type: string;
    config: Record<string, any>;
  };
  visibility?: "PRIVATE" | "ROLE" | "TENANT";
  visibilityRole?: string;
}


export interface BIReportListItem {
  id: string;
  name: string;
  datasetId: string;
  visibility: "PRIVATE" | "ROLE" | "TENANT";
  visibilityRole?: string;
  createdBy: string;
  updatedAt: string;
  visualizationType: string;
  editable: boolean;
}

export interface BIExportRequest {
  format: "csv" | "xlsx";
  query: BIQueryRequest;
}

export interface BIReportExportRequest {
  format: "csv" | "xlsx";
  overrides?: Partial<BIQueryRequest>;
}

export interface BIReportRunRequest {
  overrides?: Partial<BIQueryRequest>;
}

// ============ Service ============

export const dashboardService = {
  // ============ Dashboard Pages & Personalization ============

  async getPages(): Promise<ApiResponse<DashboardPage[]>> {
    return apiService.get<ApiResponse<DashboardPage[]>>(
      API_ENDPOINTS.DASHBOARD.LIST_AVAILABLE_PAGES()
    );
  },

  async getPageContext(page: string): Promise<ApiResponse<DashboardContext>> {
    return apiService.get<ApiResponse<DashboardContext>>(
      API_ENDPOINTS.DASHBOARD.GET_PAGE_CONTEXT(page)
    );
  },

  async getDashboard(
    page: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<DashboardData>> {
    return apiService.get<ApiResponse<DashboardData>>(
      API_ENDPOINTS.DASHBOARD.RENDER_PAGE(page),
      { params }
    );
  },

  async getPreferences(page: string): Promise<ApiResponse<DashboardPreferences>> {
    return apiService.get<ApiResponse<DashboardPreferences>>(
      API_ENDPOINTS.DASHBOARD.GET_PAGE_PREFERENCES(page)
    );
  },

  async updatePreferences(
    page: string,
    payload: UpdatePreferencesRequest
  ) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.SAVE_PAGE_PREFERENCES(page),
      payload
    );
  },

  async resetPreferences(page: string) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.RESET_PAGE_PREFERENCES(page),
      {}
    );
  },

  async getAvailableWidgets(page: string): Promise<ApiResponse<CatalogWidget[]>> {
    return apiService.get<ApiResponse<CatalogWidget[]>>(
      API_ENDPOINTS.DASHBOARD.LIST_PAGE_WIDGETS(page)
    );
  },

  async executeDrilldown(
    page: string,
    widgetId: string,
    payload: DrilldownRequest
  ){
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.EXECUTE_WIDGET_DRILLDOWN(page, widgetId),
      payload
    );
  },

  // ============ BI Dataset & Query Engine ============

  async listBIDatasets(): Promise<ApiResponse<BIDataset[]>> {
    return apiService.get<ApiResponse<BIDataset[]>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_ENGINE.LIST_DATASETS()
    );
  },

  async getBIDatasetSchema(datasetId: string): Promise<ApiResponse<BIDatasetSchema>> {
    return apiService.get<ApiResponse<BIDatasetSchema>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_ENGINE.GET_DATASET_SCHEMA(datasetId)
    );
  },

  async getBIQueryPreset(
    datasetId: string,
    presetId: string,
  ): Promise<ApiResponse<BIQueryPreset>> {
    return apiService.get<ApiResponse<BIQueryPreset>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_ENGINE.GET_QUERY_PRESET(datasetId, presetId)
    );
  },

  async runBIQuery(
    datasetId: string,
    payload: BIQueryRequest
  ) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_ENGINE.EXECUTE_QUERY(datasetId),
      payload
    );
  },

  async validateBIQuery(
    datasetId: string,
    payload: BIQueryRequest
  ) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_ENGINE.VALIDATE_QUERY(datasetId),
      payload
    );
  },

  // ============ Saved Reports ============

  async listBIReports(): Promise<ApiResponse<BIReportListItem[]>> {
    return apiService.get<ApiResponse<BIReportListItem[]>>(
      API_ENDPOINTS.DASHBOARD.REPORTS.LIST_REPORTS()
    );
  },

  async getBIReport(reportId: string): Promise<ApiResponse<BIReport>> {
    return apiService.get<ApiResponse<BIReport>>(
      API_ENDPOINTS.DASHBOARD.REPORTS.GET_REPORT(reportId)
    );
  },

  async createBIReport(payload: Partial<BIReport>) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.REPORTS.CREATE_REPORT(),
      payload
    );
  },

  async updateBIReport(
    reportId: string,
    payload: Partial<BIReport>
  ) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.REPORTS.UPDATE_REPORT(reportId),
      payload
    );
  },

  async deleteBIReport(reportId: string): Promise<ApiResponse<{}>> {
    return apiService.delete<ApiResponse<{}>>(
      API_ENDPOINTS.DASHBOARD.REPORTS.DELETE_REPORT(reportId)
    );
  },

  async runBIReport(
    reportId: string,
    payload: BIReportRunRequest
  ) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.REPORTS.RUN_REPORT(reportId),
      payload
    );
  },

  async exportBIReport(
    reportId: string,
    payload: BIReportExportRequest
  ) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.REPORTS.EXPORT_REPORT(reportId),
      payload
    );
  },

  // ============ Async Exports ============

  async createBIExport(
    datasetId: string,
    payload: BIExportRequest
  ){
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.BI_ASYNC_EXP.POST(datasetId),
      payload
    );
  },

  async getBIExportJob(jobRef: string): Promise<ApiResponse<BIExportJob>> {
    return apiService.get<ApiResponse<BIExportJob>>(
      API_ENDPOINTS.DASHBOARD.BI_ASYNC_EXP.GET_JOB(jobRef)
    );
  },

  async downloadBIExport(jobRef: string): Promise<Blob> {
    const response = await apiService.get(
      API_ENDPOINTS.DASHBOARD.BI_ASYNC_EXP.DOWNLOAD(jobRef),
      { responseType: "blob" }
    );
    return response as unknown as Blob;
  },

  // ============ Dashboard Builder Administration ============

  async listDashboardBuilderPages(): Promise<ApiResponse<DashboardBuilderPage[]>> {
    return apiService.get<ApiResponse<DashboardBuilderPage[]>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.LIST_PAGES()
    );
  },

  async getDashboardBuilderPage(pageId: string): Promise<ApiResponse<DashboardBuilderPage>> {
    return apiService.get<ApiResponse<DashboardBuilderPage>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.GET_PAGE(pageId)
    );
  },

  async createDashboardBuilderPage(
    payload: Partial<DashboardBuilderPage>
  ): Promise<ApiResponse<DashboardBuilderPage>> {
    return apiService.post<ApiResponse<DashboardBuilderPage>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.CREATE_PAGE(),
      payload
    );
  },

  async updateDashboardBuilderPage(pageId: string, payload: Partial<DashboardBuilderPage>) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.BUILDER.UPDATE_PAGE(pageId),
      payload
    );
  },

  async deleteDashboardBuilderPage(pageId: string): Promise<ApiResponse<{}>> {
    return apiService.delete<ApiResponse<{}>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.DELETE_PAGE(pageId)
    );
  },

  async listDashboardBuilderWidgets(pageId: string): Promise<ApiResponse<DashboardBuilderWidget[]>> {
    return apiService.get<ApiResponse<DashboardBuilderWidget[]>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.LIST_WIDGETS(pageId)
    );
  },

  async addDashboardBuilderWidget(pageId: string, payload: Partial<DashboardBuilderWidget>) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.BUILDER.ADD_WIDGET(pageId),
      payload
    );
  },

  async updateDashboardBuilderWidget(pageId: string, widgetId: string, payload: Partial<DashboardBuilderWidget>) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.BUILDER.UPDATE_WIDGET(pageId, widgetId),
      payload
    );
  },

  async deleteDashboardBuilderWidget(pageId: string, widgetId: string): Promise<ApiResponse<{}>> {
    return apiService.delete<ApiResponse<{}>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.DELETE_WIDGET(pageId, widgetId)
    );
  },

  async listDashboardBuilderFilters(pageId: string): Promise<ApiResponse<DashboardBuilderFilter[]>> {
    return apiService.get<ApiResponse<DashboardBuilderFilter[]>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.LIST_FILTERS(pageId)
    );
  },

  async addDashboardBuilderFilter(pageId: string, payload: Partial<DashboardBuilderFilter>) {
    return apiService.post(
      API_ENDPOINTS.DASHBOARD.BUILDER.ADD_FILTER(pageId),
      payload
    );
  },

  async updateDashboardBuilderFilter(pageId: string, filterId: string, payload: Partial<DashboardBuilderFilter>) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.BUILDER.UPDATE_FILTER(pageId, filterId),
      payload
    );
  },

  async deleteDashboardBuilderFilter(pageId: string, filterId: string): Promise<ApiResponse<{}>> {
    return apiService.delete<ApiResponse<{}>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.DELETE_FILTER(pageId, filterId)
    );
  },

  async getDashboardBuilderMeta(): Promise<ApiResponse<DashboardBuilderMeta>> {
    return apiService.get<ApiResponse<DashboardBuilderMeta>>(
      API_ENDPOINTS.DASHBOARD.BUILDER.GET_BUILDER_META()
    );
  },

  // ============ BI Query Sets (Admin) ============

  async listBIQuerySets(): Promise<ApiResponse<DashboardQuerySet[]>> {
    return apiService.get<ApiResponse<DashboardQuerySet[]>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_SETS.LIST_QUERY_SETS()
    );
  },

  async getBIQuerySet(id: string): Promise<ApiResponse<DashboardQuerySet>> {
    return apiService.get<ApiResponse<DashboardQuerySet>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_SETS.GET_QUERY_SET(id)
    );
  },

  async createBIQuerySet(
    payload: Partial<DashboardQuerySet>
  ): Promise<ApiResponse<DashboardQuerySet>> {
    return apiService.post<ApiResponse<DashboardQuerySet>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_SETS.CREATE_QUERY_SET(),
      payload
    );
  },

  async updateBIQuerySet(id: string, payload: Partial<DashboardQuerySet>) {
    return apiService.put(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_SETS.UPDATE_QUERY_SET(id),
      payload
    );
  },

  async deleteBIQuerySet(id: string): Promise<ApiResponse<{}>> {
    return apiService.delete<ApiResponse<{}>>(
      API_ENDPOINTS.DASHBOARD.BI_QUERY_SETS.DELETE_QUERY_SET(id)
    );
  },
};