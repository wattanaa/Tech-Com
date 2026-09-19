import { z } from 'zod';
import { cuid, emailField, phoneField, thaiText } from './common.js';

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(200),
});

/**
 * เกณฑ์รหัสผ่าน: เน้นความยาวเป็นหลักตามคำแนะนำ NIST
 * ยาว 12 ตัวขึ้นไปและมีทั้งตัวอักษรกับตัวเลข ปลอดภัยกว่าการบังคับอักขระพิเศษ
 * ซึ่งมักทำให้คนตั้งรหัสที่เดาง่ายลงท้ายด้วยเครื่องหมายตกใจ
 */
export const passwordField = z
  .string()
  .min(12, 'รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร')
  .max(200, 'รหัสผ่านยาวเกินไป')
  .regex(/[A-Za-z]/, 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว')
  .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านเดิม'),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม',
    path: ['newPassword'],
  });

export const updateProfileSchema = z.object({
  name: thaiText('ชื่อ-สกุล', 2, 150),
  phone: phoneField,
  avatarId: cuid.nullish(),
});

export const createUserSchema = z.object({
  email: emailField,
  name: thaiText('ชื่อ-สกุล', 2, 150),
  password: passwordField,
  roleId: cuid,
  phone: phoneField,
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: thaiText('ชื่อ-สกุล', 2, 150).optional(),
  roleId: cuid.optional(),
  phone: phoneField,
  isActive: z.boolean().optional(),
  /** ตั้งรหัสผ่านใหม่ให้ผู้ใช้ — เฉพาะ SUPER_ADMIN */
  newPassword: passwordField.optional(),
});
