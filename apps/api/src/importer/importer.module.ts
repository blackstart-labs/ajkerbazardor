import { Module } from '@nestjs/common';
import { TcbParserService } from './tcb-parser.service.js';
import { ImportService } from './import.service.js';
import { ImportController } from './import.controller.js';

@Module({
  controllers: [ImportController],
  providers: [TcbParserService, ImportService],
  exports: [TcbParserService, ImportService],
})
export class ImporterModule {}
