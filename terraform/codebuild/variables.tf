variable "project_name" {
  description = "DinoPark Search - DinoParks search service"
  default     = "dino-park-search"
}

variable "github_repo" {
  default = "https://github.com/mozilla-iam/dino-park-search"
}

variable "buildspec_file" {
  description = "Path and name of your builspec file"
  default     = "buildspec.yml"
}

# Find all the supported images by AWS here: 
# https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html
variable "build_image" {
  default = "aws/codebuild/standard:1.0"
}

