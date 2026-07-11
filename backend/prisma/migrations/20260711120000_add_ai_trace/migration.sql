BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AiTrace] (
    [TraceID] INT NOT NULL IDENTITY(1,1),
    [Question] TEXT NOT NULL,
    [Answer] TEXT NOT NULL,
    [Prompt] TEXT NOT NULL,
    [PromptVersion] VARCHAR(20),
    [Model] VARCHAR(50) NOT NULL,
    [RetrievedChunks] TEXT NOT NULL,
    [RetrievalMs] INT NOT NULL,
    [LlmMs] INT NOT NULL,
    [TotalMs] INT NOT NULL,
    [TokensIn] INT NOT NULL,
    [TokensOut] INT NOT NULL,
    [CostUsd] FLOAT(53) NOT NULL,
    [Groundedness] VARCHAR(10) NOT NULL,
    [RetrievalQuality] VARCHAR(10) NOT NULL,
    [HallucinationRisk] BIT NOT NULL,
    [AnswerRelevance] VARCHAR(10) NOT NULL,
    [UserFeedback] VARCHAR(20),
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [AiTrace_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AiTrace_pkey] PRIMARY KEY CLUSTERED ([TraceID])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
