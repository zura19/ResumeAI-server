import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { GeneratedLinkDto } from '../dto/generated-resume/generated-link.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { LinkService } from './link.service';

@UseGuards(AuthGuard('jwt'))
@Controller([
  'generated-resumes/:generatedResumeId/link',
  'generated-resumes/:generatedResumeId/links',
])
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Post()
  create(
    @Param('generatedResumeId') generatedResumeId: string,
    @Body() body: GeneratedLinkDto,
    @UserDecorator() user: User,
  ) {
    return this.linkService.create(generatedResumeId, body, user.id);
  }

  @Patch('reorder/:id')
  reorder(
    @Param('generatedResumeId') generatedResumeId: string,
    @Param('id') id: string,
    @Body() body: ReorderDto,
    @UserDecorator() user: User,
  ) {
    return this.linkService.reorder(generatedResumeId, id, body, user.id);
  }

  @Patch(':id')
  update(
    @Param('generatedResumeId') generatedResumeId: string,
    @Param('id') id: string,
    @Body() body: GeneratedLinkDto,
    @UserDecorator() user: User,
  ) {
    return this.linkService.update(generatedResumeId, id, body, user.id);
  }

  @Delete(':id')
  remove(
    @Param('generatedResumeId') generatedResumeId: string,
    @Param('id') id: string,
    @UserDecorator() user: User,
  ) {
    return this.linkService.remove(generatedResumeId, id, user.id);
  }
}
