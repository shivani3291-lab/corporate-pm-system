BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Employee] (
    [EmployeeID] INT NOT NULL IDENTITY(1,1),
    [FirstName] VARCHAR(50) NOT NULL,
    [LastName] VARCHAR(50) NOT NULL,
    [Email] VARCHAR(100) NOT NULL,
    [Role] VARCHAR(50),
    CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([EmployeeID]),
    CONSTRAINT [Employee_Email_key] UNIQUE NONCLUSTERED ([Email])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [ProjectID] INT NOT NULL IDENTITY(1,1),
    [ProjectName] VARCHAR(100) NOT NULL,
    [ClientName] VARCHAR(100),
    [Description] TEXT,
    [StartDate] DATETIME2,
    [EndDate] DATETIME2,
    [Status] VARCHAR(50),
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([ProjectID])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [CategoryID] INT NOT NULL IDENTITY(1,1),
    [CategoryName] VARCHAR(100) NOT NULL,
    [Description] TEXT,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([CategoryID]),
    CONSTRAINT [Category_CategoryName_key] UNIQUE NONCLUSTERED ([CategoryName])
);

-- CreateTable
CREATE TABLE [dbo].[FileLocation] (
    [FileLocationID] INT NOT NULL IDENTITY(1,1),
    [FilePath] TEXT NOT NULL,
    [LocationType] VARCHAR(50),
    [Notes] TEXT,
    CONSTRAINT [FileLocation_pkey] PRIMARY KEY CLUSTERED ([FileLocationID])
);

-- CreateTable
CREATE TABLE [dbo].[Document] (
    [DocumentID] INT NOT NULL IDENTITY(1,1),
    [ProjectID] INT NOT NULL,
    [CategoryID] INT,
    [FileLocationID] INT,
    [DocumentTitle] VARCHAR(150) NOT NULL,
    [FileName] VARCHAR(150),
    [VersionNumber] VARCHAR(20),
    [CreatedDate] DATETIME2,
    [UpdatedDate] DATETIME2,
    [CreatedBy] VARCHAR(100),
    CONSTRAINT [Document_pkey] PRIMARY KEY CLUSTERED ([DocumentID])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [TaskID] INT NOT NULL IDENTITY(1,1),
    [ProjectID] INT NOT NULL,
    [TaskName] VARCHAR(100) NOT NULL,
    [Description] TEXT,
    [DueDate] DATETIME2,
    [Status] VARCHAR(50),
    [Priority] VARCHAR(20),
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([TaskID])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectAssignment] (
    [AssignmentID] INT NOT NULL IDENTITY(1,1),
    [EmployeeID] INT NOT NULL,
    [ProjectID] INT NOT NULL,
    [RoleInProject] VARCHAR(100),
    CONSTRAINT [ProjectAssignment_pkey] PRIMARY KEY CLUSTERED ([AssignmentID])
);

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_ProjectID_fkey] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([ProjectID]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_CategoryID_fkey] FOREIGN KEY ([CategoryID]) REFERENCES [dbo].[Category]([CategoryID]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_FileLocationID_fkey] FOREIGN KEY ([FileLocationID]) REFERENCES [dbo].[FileLocation]([FileLocationID]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_ProjectID_fkey] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([ProjectID]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectAssignment] ADD CONSTRAINT [ProjectAssignment_EmployeeID_fkey] FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employee]([EmployeeID]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectAssignment] ADD CONSTRAINT [ProjectAssignment_ProjectID_fkey] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project]([ProjectID]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
