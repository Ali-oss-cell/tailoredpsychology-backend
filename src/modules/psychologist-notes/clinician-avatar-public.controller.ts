import { Controller, Get, Header, NotFoundException, Param, StreamableFile } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { createReadStream, existsSync } from "fs";
import { join } from "path";

@ApiTags("public")
@Controller()
export class ClinicianAvatarPublicController {
  @Get("public/clinician-avatars/:filename")
  @ApiOperation({ summary: "Serve uploaded clinician profile photo (public URL stored on bio row)" })
  @ApiOkResponse({ description: "Binary image stream" })
  @Header("Cache-Control", "public, max-age=86400")
  getAvatar(@Param("filename") filename: string): StreamableFile {
    if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
      throw new NotFoundException();
    }
    const path = join(process.cwd(), "uploads", "clinician-avatars", filename);
    if (!existsSync(path)) {
      throw new NotFoundException();
    }
    const ext = filename.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";
    const stream = createReadStream(path);
    return new StreamableFile(stream, { type: mime, disposition: `inline; filename="${filename}"` });
  }
}
