import { SetMetadata } from '@nestjs/common';

export const BypassGuard = () => SetMetadata('bypassGuard', true);
