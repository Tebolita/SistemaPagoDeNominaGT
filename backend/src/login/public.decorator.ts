import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca una ruta como pública: el AuthGuard global no le exigirá token
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
