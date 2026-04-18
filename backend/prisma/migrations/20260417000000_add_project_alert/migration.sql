BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjectAlert] (
    [AlertID] INT NOT NULL IDENTITY(1,1),
    [ProjectID] INT NOT NULL,
    [AlertType] VARCHAR(80) NOT NULL,
    [Severity] VARCHAR(20) NOT NULL,
    [Message] TEXT,
    [TaskID] INT,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [ProjectAlert_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectAlert_pkey] PRIMARY KEY CLUSTERED ([AlertID])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProjectAlert] ADD CONSTRAINT [ProjectAlert_ProjectID_fkey] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([ProjectID]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
