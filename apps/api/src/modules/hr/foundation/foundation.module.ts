import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { IdentityRegistryModule } from '../../identity-registry/identity-registry.module';

@Module({
    imports: [IdentityRegistryModule],
    providers: [EmployeeService],
    exports: [EmployeeService],
})
export class FoundationModule { }
