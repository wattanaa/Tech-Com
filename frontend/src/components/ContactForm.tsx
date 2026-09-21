import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import { sendContact } from '@/api/public';
import { Button } from './ui/Button';
import { cn } from '@/utils/cn';

const schema = z.object({
  name: z.string().min(2, 'กรุณากรอกชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'กรุณากรอกหัวข้อ'),
  message: z.string().min(10, 'กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร'),
});
type FormValues = z.infer<typeof schema>;

/** ฟอร์มติดต่อ — ตรวจข้อมูลด้วย Zod แล้วส่งไปยัง API */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: sendContact,
    onSuccess: () => reset(),
  });

  if (mutation.isSuccess) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-lg px-6 py-12 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-success/[0.12] text-success">
          <CheckCircle2 className="size-7" aria-hidden />
        </div>
        <h3 className="font-display text-lg font-semibold">ส่งข้อความเรียบร้อยแล้ว</h3>
        <p className="max-w-sm text-sm text-ink-muted">
          ขอบคุณที่ติดต่อแผนกวิชา เราจะติดต่อกลับโดยเร็วที่สุด
        </p>
        <Button variant="outline" size="sm" onClick={() => mutation.reset()}>ส่งข้อความอีกครั้ง</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="glass flex flex-col gap-4 rounded-lg p-6"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อ-นามสกุล" error={errors.name?.message} required>
          <input {...register('name')} id="name" className={inputCls(!!errors.name)} placeholder="ชื่อของคุณ" />
        </Field>
        <Field label="อีเมล" error={errors.email?.message} required>
          <input {...register('email')} id="email" type="email" className={inputCls(!!errors.email)} placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="เบอร์โทรศัพท์" error={errors.phone?.message}>
        <input {...register('phone')} id="phone" className={inputCls(!!errors.phone)} placeholder="ไม่บังคับ" />
      </Field>
      <Field label="หัวข้อ" error={errors.subject?.message} required>
        <input {...register('subject')} id="subject" className={inputCls(!!errors.subject)} placeholder="เรื่องที่ต้องการติดต่อ" />
      </Field>
      <Field label="ข้อความ" error={errors.message?.message} required>
        <textarea {...register('message')} id="message" rows={5} className={cn(inputCls(!!errors.message), 'resize-y')} placeholder="รายละเอียด" />
      </Field>

      {mutation.isError && (
        <p className="rounded-sm bg-danger/[0.10] px-3 py-2 text-sm text-danger" role="alert">
          ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
        </p>
      )}

      <Button type="submit" isLoading={mutation.isPending} leftIcon={<Send className="size-4" aria-hidden />} className="self-start">
        ส่งข้อความ
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-display text-[13px] font-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-sm border bg-surface/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink-subtle',
    'focus:ring-2 focus:ring-brand-500/40',
    hasError ? 'border-danger/50' : 'border-hairline/20 focus:border-brand-500',
  );
}
