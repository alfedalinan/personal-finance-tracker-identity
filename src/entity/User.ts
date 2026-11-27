import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  tenantId?: string;

  @Column()
  passwordHash!: string;

  @Column({ type: "simple-array", default: "" })
  roles!: string[];

  @Column({ type: "text", nullable: true })
  claimsJson?: string; // JSON string of custom claims to incorporate into access token

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
