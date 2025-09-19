export class CreateLinkDto {
  id?: string;
  name?: string;
  onlineIcon?: string;
  textIcon?: string;
  uploadIcon?: string;
  iconType?: string;
  int?: string;
  ext?: string;
  desc?: string;
}

export class DeleteLinkDto {
  id!: string;
}