import { SetMetadata } from '@nestjs/common';

export const IS_DEVICE_OPTIONAL_KEY = 'isDeviceOptional';
export const OptionalDevice = () => SetMetadata(IS_DEVICE_OPTIONAL_KEY, true);
