import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CachePurgerService {
  private readonly logger = new Logger(CachePurgerService.name);
  private version = Date.now();
  private tags = new Map<string, number>();

  getVersion(): number {
    return this.version;
  }

  getTagVersion(tag: string): number {
    return this.tags.get(tag) || this.version;
  }

  purge(tags?: string[]): void {
    this.version = Date.now();
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        this.tags.set(tag, this.version);
      }
      this.logger.log(`Purged cache for tags: ${tags.join(', ')} (version: ${this.version})`);
    } else {
      this.tags.clear();
      this.logger.log(`Purged all read API caches (version: ${this.version})`);
    }
  }
}
