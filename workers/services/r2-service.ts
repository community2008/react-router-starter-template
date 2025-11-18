import type { R2Bucket, R2Object } from '@cloudflare/workers-types';

export interface R2Service {
  uploadFile(file: File, path: string): Promise<string>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<boolean>;
  listFiles(prefix?: string): Promise<R2Object[]>;
}

export class CloudflareR2Service implements R2Service {
  constructor(private bucket: R2Bucket) {}

  async uploadFile(file: File, path: string): Promise<string> {
    const fileBuffer = await file.arrayBuffer();
    
    await this.bucket.put(path, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return path;
  }

  async getFileUrl(path: string): Promise<string> {
    // 对于私有R2桶，我们需要通过Workers API来提供文件访问
    // 这里返回文件路径，前端可以通过API端点来获取文件内容
    // 例如：/api/files/${path}
    return path;
  }

  async deleteFile(path: string): Promise<boolean> {
    const result = await this.bucket.delete(path);
    return result !== null;
  }

  async listFiles(prefix?: string): Promise<R2Object[]> {
    const result = await this.bucket.list({
      prefix,
      limit: 100,
    });

    return result.objects || [];
  }
}

// 创建R2服务实例
export function createR2Service(bucket: R2Bucket): R2Service {
  return new CloudflareR2Service(bucket);
}