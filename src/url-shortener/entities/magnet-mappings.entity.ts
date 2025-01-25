import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MagnetMappings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shortMagnet: string;

  @Column({ type: "longtext" })
  fullMagnet: string;
}
