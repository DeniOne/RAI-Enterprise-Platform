import { Global, Module } from '@nestjs/common';
import { HsmService } from './hsm.service';
import { MultisigService } from './multisig.service';

@Global()
@Module({
    providers: [HsmService, MultisigService],
    exports: [HsmService, MultisigService],
})
export class CryptoModule { }
