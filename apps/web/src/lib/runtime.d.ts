export declare function apiFetch(url: string, options?: RequestInit): Promise<any>;
export declare function apiUpload(url: string, formData: FormData): Promise<any>;
export declare function apiDownload(url: string, filename: string): Promise<void>;
export declare function DashboardHeader(props: { title: string; subtitle: string }): JSX.Element;
