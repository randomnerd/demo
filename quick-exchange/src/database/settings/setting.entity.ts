import { IsJSON, IsString } from 'class-validator';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class Setting {
    // project environment:
    // production / development / etc
    // (+ special names: default, local)
    @PrimaryColumn()
    @IsString()
    env: string;

    @PrimaryColumn()
    @IsString()
    key: string;

    @Column({ type: 'jsonb' })
    @IsJSON()
    value: any;
}
