import { PartialType } from '@nestjs/mapped-types';
import { EnableDeveloperDto } from './enable-developer.dto';

export class UpdateDeveloperDto extends PartialType(EnableDeveloperDto) { }
