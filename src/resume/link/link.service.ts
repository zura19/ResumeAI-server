import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { GeneratedLinkDto } from '../dto/generated-resume/generated-link.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { GeneratedResumeContentService } from '../generated-resume-content/generated-resume-content.service';

@Injectable()
export class LinkService {
  constructor(
    private readonly db: DbService,
    private readonly generatedResumeContent: GeneratedResumeContentService,
  ) {}

  private get linkModel() {
    return (this.db as any).link;
  }

  private data(data: GeneratedLinkDto, order?: number) {
    return {
      url: data.url,
      ...(data.type ? { type: data.type } : {}),
      ...(order === undefined ? {} : { order }),
    };
  }

  async create(
    generatedResumeId: string,
    data: GeneratedLinkDto,
    userId: string,
  ) {
    await this.generatedResumeContent.assertOwnership(
      generatedResumeId,
      userId,
    );
    const order = await this.linkModel.count({ where: { generatedResumeId } });
    return this.linkModel.create({
      data: { generatedResumeId, ...this.data(data, order) },
    });
  }

  async update(
    generatedResumeId: string,
    id: string,
    data: GeneratedLinkDto,
    userId: string,
  ) {
    await this.generatedResumeContent.assertOwnership(
      generatedResumeId,
      userId,
    );
    const result = await this.linkModel.updateMany({
      where: { id, generatedResumeId },
      data: this.data(data),
    });
    if (!result.count) throw new NotFoundException('Link not found.');

    return {
      message: 'Link updated successfully',
    };
  }

  async remove(generatedResumeId: string, id: string, userId: string) {
    await this.generatedResumeContent.assertOwnership(
      generatedResumeId,
      userId,
    );
    const result = await this.linkModel.deleteMany({
      where: { id, generatedResumeId },
    });
    if (!result.count) throw new NotFoundException('Link not found.');

    return {
      message: 'Link deleted successfully',
    };
  }

  async reorder(
    generatedResumeId: string,
    id: string,
    data: ReorderDto,
    userId: string,
  ) {
    await this.generatedResumeContent.assertOwnership(
      generatedResumeId,
      userId,
    );
    return this.db.$transaction(async (tx) => {
      const linkDelegate = (tx as any).link;
      const items = await linkDelegate.findMany({
        where: { generatedResumeId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
      const currentIndex = items.findIndex((item: any) => item.id === id);
      if (currentIndex === -1)
        throw new NotFoundException('Link not found.');

      const [item] = items.splice(currentIndex, 1);
      const order = Math.max(0, Math.min(data.order, items.length));
      items.splice(order, 0, item);
      await Promise.all(
        items.map((entry: any, index: number) =>
          linkDelegate.update({
            where: { id: entry.id },
            data: { order: index },
          }),
        ),
      );
      return { id, order };
    });
  }
}
