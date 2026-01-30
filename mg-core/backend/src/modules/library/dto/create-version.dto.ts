import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateVersionDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version must be in semver format (X.Y.Z)' })
    version: string;

    // File will be handled via multipart/form-data
    // Validation happens in controller
}
