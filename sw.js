/* =====================================================================
 * law-firm-archive 演示站 · 纯前端 Mock
 *
 * 设计要点（与 law-firm-demo 同源经验）：
 *  1. 响应包装严格对齐后端：Result<T> = {success, code, message, data}
 *     分页对象 PageResult<T> = {current, size, total, pages, records}
 *     —— 注意本项目的分页字段是 records/current/size，不是 list/pageNum
 *  2. 集合按需懒构建（SEED_BUILDERS），避免一次性生成全部数据
 *  3. 字段名与类型全部由后端 DTO/Response 类反查生成，不手工臆造
 *  4. 汇总类数据（统计）由明细实算，禁止随机数，避免"卡片与明细对不上"
 * ===================================================================== */
const SW_VERSION = 'ARCHIVE-DEMO-1.0.0';

/* ---------------- 基础工具 ---------------- */
let _seq = 1000;
function nextId() { return ++_seq; }
function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n, w) { return String(n).padStart(w, '0'); }
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}
function hoursAgo(n) {
  const d = new Date(Date.now() - n * 3600000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
function nowStr() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

/* ---------------- 中文语料池 ---------------- */
const SURNAME = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'.split('');
const GIVEN = ['伟','芳','娜','敏','静','丽','强','磊','洋','艳','勇','军','杰','娟','涛','明','超','秀英','建国','志强'];
const DEPTS = ['民事法律事务部','商事法律事务部','刑事法律事务部','行政法务部','知识产权部','财务部','行政人事部'];
const CLIENTS = ['贵州黄泽国矿业有限责任公司','贵阳恒通建材有限公司','遵义兴盛农业合作社','安顺宏远物流有限公司','六盘水金源房地产开发有限公司'];
const CASE_TYPE = ['买卖合同纠纷','建设工程施工合同纠纷','劳动争议','股权转让纠纷','民间借贷纠纷','侵权责任纠纷','房屋租赁合同纠纷'];

function personName() { return pick(SURNAME) + pick(GIVEN); }
function fullName() {
  const n = (Math.random() < 0.7) ? 2 : 3;
  let s = pick(SURNAME);
  for (let i = 0; i < n; i++) s += pick(GIVEN);
  return s;
}

/* ---------------- 真实枚举（取自前端 utils/archiveEnums.js）---------------- */
const ENUM = {
  ARCHIVE_TYPES: ['DOCUMENT','SCIENCE','ACCOUNTING','PERSONNEL','SPECIAL','AUDIOVISUAL','LITIGATION','NON_LITIGATION','CONTRACT'],
  ARCHIVE_FORMS: ['ELECTRONIC','PHYSICAL','HYBRID'],
  ARCHIVE_STATUS: ['DRAFT','PENDING_REVIEW','REJECTED','RECEIVED','PROCESSING','CATALOGING','STORED','BORROWED','DESTROYED','PARTIAL','FAILED'],
  RETENTION_PERIODS: ['PERMANENT','LONG_TERM','SHORT_TERM','TEMPORARY'],
  SECURITY_LEVELS: ['PUBLIC','INTERNAL','CONFIDENTIAL','SECRET'],
  USER_TYPES: ['SYSTEM_ADMIN','SECURITY_ADMIN','AUDIT_ADMIN','ARCHIVE_REVIEWER','ARCHIVE_MANAGER','USER'],
  BORROW_STATUS: ['PENDING','APPROVED','REJECTED','LENT','RETURNED','OVERDUE','CANCELLED'],
};

/* ---------------- 类型 -> 字段表（由后端 DTO 反查生成）---------------- */
const TYPE_FIELDS = {
  AppraisalRecordResponse: [['id','Long'], ['archiveId','Long'], ['appraisalType','String'], ['originalValue','String'], ['newValue','String'], ['appraisalReason','String'], ['status','String'], ['appraiserName','String'], ['appraisedAt','LocalDateTime'], ['approverName','String'], ['approvedAt','LocalDateTime'], ['approvalComment','String']],
  AppraisalRecordSummaryResponse: [['id','Long'], ['archiveId','Long'], ['appraisalType','String'], ['originalValue','String'], ['newValue','String'], ['appraisalReason','String'], ['status','String'], ['appraiserName','String'], ['appraisedAt','LocalDateTime'], ['approverName','String'], ['approvedAt','LocalDateTime']],
  ArchiveDTO: [['id','Long'], ['archiveNo','String'], ['fondsId','Long'], ['fondsNo','String'], ['fondsName','String'], ['categoryId','Long'], ['categoryCode','String'], ['categoryName','String'], ['archiveType','String'], ['title','String'], ['fileNo','String'], ['responsibility','String'], ['archiveDate','LocalDate'], ['documentDate','LocalDate'], ['pageCount','Integer'], ['piecesCount','Integer'], ['retentionPeriod','String'], ['retentionPeriodName','String'], ['retentionExpireDate','LocalDate'], ['securityLevel','String'], ['securityExpireDate','LocalDate'], ['sourceType','String'], ['sourceSystem','String'], ['sourceId','String'], ['sourceNo','String'], ['caseNo','String'], ['caseName','String'], ['clientName','String'], ['lawyerName','String'], ['caseCloseDate','LocalDate'], ['archiveForm','String'], ['hasElectronic','Boolean'], ['hasPhysical','Boolean'], ['locationId','Long'], ['storageLocation','String'], ['boxNo','String'], ['totalFileSize','Long'], ['fileCount','Integer'], ['status','String'], ['statusName','String'], ['receivedAt','LocalDateTime'], ['receivedByName','String'], ['catalogedAt','LocalDateTime'], ['catalogedByName','String'], ['archivedAt','LocalDateTime'], ['archivedByName','String'], ['keywords','String'], ['archiveAbstract','String'], ['remarks','String'], ['extraData','Map_String_Object'], ['files','List_DigitalFileDTO'], ['createdAt','LocalDateTime'], ['updatedAt','LocalDateTime']],
  ArchiveTypeStatisticsResponse: [['type','String'], ['name','String'], ['count','long']],
  BackupJobResponse: [['backupNo','String'], ['targetName','String'], ['status','String'], ['statusMessage','String'], ['followUpRequired','boolean']],
  BackupSetResponse: [['targetId','Long'], ['targetName','String'], ['targetType','String'], ['backupSetName','String'], ['displayPath','String'], ['createdAt','LocalDateTime'], ['databaseMode','String'], ['databaseRestorable','Boolean'], ['filesRestorable','Boolean'], ['configRestorable','Boolean'], ['fileCount','Long'], ['objectCount','Long'], ['totalBytes','Long'], ['verifyStatus','String'], ['verifyMessage','String']],
  BackupTargetResponse: [['id','Long'], ['name','String'], ['targetType','String'], ['enabled','Boolean'], ['displayAddress','String'], ['localPath','String'], ['smbHost','String'], ['smbPort','Integer'], ['smbShare','String'], ['smbUsername','String'], ['smbSubPath','String'], ['remarks','String'], ['verifyStatus','String'], ['verifyMessage','String']],
  BackupTargetSummaryResponse: [['id','Long'], ['name','String'], ['targetType','String'], ['enabled','Boolean'], ['displayAddress','String'], ['verifyStatus','String'], ['verifyMessage','String']],
  BorrowApplicationSummaryResponse: [['id','Long'], ['applicationNo','String'], ['archiveNo','String'], ['archiveTitle','String'], ['applicantName','String'], ['applicantDept','String'], ['applyTime','LocalDateTime'], ['borrowType','String'], ['expectedReturnDate','LocalDate'], ['status','String']],
  BorrowLinkAccessResponse: [['valid','Boolean'], ['invalidReason','String'], ['archive','ArchiveInfo'], ['files','List_FileInfo'], ['linkInfo','LinkInfo'], ['borrower','BorrowerInfo']],
  BorrowLinkResponse: [['id','Long'], ['borrowId','Long'], ['archiveId','Long'], ['archiveNo','String'], ['sourceType','String'], ['sourceUserName','String'], ['borrowPurpose','String'], ['expireAt','LocalDateTime'], ['maxAccessCount','Integer'], ['allowDownload','Boolean'], ['accessCount','Integer'], ['downloadCount','Integer'], ['lastAccessAt','LocalDateTime'], ['lastAccessIp','String'], ['status','String'], ['revokeReason','String'], ['revokedAt','LocalDateTime'], ['createdAt','LocalDateTime'], ['accessUrl','String']],
  BorrowLinkSummaryResponse: [['id','Long'], ['archiveId','Long'], ['archiveNo','String'], ['sourceType','String'], ['sourceUserName','String'], ['borrowPurpose','String'], ['expireAt','LocalDateTime'], ['maxAccessCount','Integer'], ['allowDownload','Boolean'], ['accessCount','Integer'], ['downloadCount','Integer'], ['lastAccessAt','LocalDateTime'], ['lastAccessIp','String'], ['status','String'], ['createdAt','LocalDateTime']],
  BorrowStatisticsResponse: [['totalBorrows','long'], ['monthlyBorrows','long'], ['overdue','long']],
  CategoryResponse: [['id','Long'], ['parentId','Long'], ['categoryCode','String'], ['categoryName','String'], ['archiveType','String'], ['level','Integer'], ['sortOrder','Integer'], ['retentionPeriod','String'], ['description','String'], ['status','String'], ['fullPath','String'], ['children','List_CategoryResponse']],
  CategoryTreeResponse: [['id','Long'], ['parentId','Long'], ['categoryCode','String'], ['categoryName','String'], ['children','List_CategoryTreeResponse']],
  DeadLetterRecordResponse: [['id','Long'], ['errorMessage','String'], ['status','String']],
  DestructionRecordResponse: [['id','Long'], ['destructionBatchNo','String'], ['archiveId','Long'], ['destructionReason','String'], ['destructionMethod','String'], ['status','String'], ['proposerName','String'], ['proposedAt','LocalDateTime'], ['approverName','String'], ['approvedAt','LocalDateTime'], ['approvalComment','String'], ['executorName','String'], ['executedAt','LocalDateTime']],
  DestructionRecordSummaryResponse: [['id','Long'], ['destructionBatchNo','String'], ['archiveId','Long'], ['destructionReason','String'], ['destructionMethod','String'], ['status','String'], ['proposerName','String'], ['proposedAt','LocalDateTime'], ['approverName','String'], ['approvedAt','LocalDateTime'], ['executorName','String'], ['executedAt','LocalDateTime']],
  DigitalFileDTO: [['id','Long'], ['archiveId','Long'], ['fileNo','String'], ['fileName','String'], ['originalName','String'], ['fileExtension','String'], ['mimeType','String'], ['fileSize','Long'], ['fileSizeFormatted','String'], ['formatName','String'], ['isLongTermFormat','Boolean'], ['hashAlgorithm','String'], ['hashValue','String'], ['hasPreview','Boolean'], ['previewUrl','String'], ['thumbnailUrl','String'], ['downloadUrl','String'], ['fileCategory','String'], ['fileCategoryName','String'], ['sortOrder','Integer'], ['description','String'], ['volumeNo','Integer'], ['sectionType','String'], ['documentNo','String'], ['pageStart','Integer'], ['pageEnd','Integer'], ['versionLabel','String'], ['fileSourceType','String'], ['scanBatchNo','String'], ['scanOperator','String'], ['scanTime','LocalDateTime'], ['scanCheckStatus','String'], ['scanCheckBy','String'], ['scanCheckTime','LocalDateTime'], ['ocrStatus','String'], ['uploadAt','LocalDateTime'], ['uploadByName','String'], ['createdAt','LocalDateTime']],
  ExternalSourceResponse: [['id','Long'], ['sourceCode','String'], ['sourceName','String'], ['sourceType','String'], ['description','String'], ['apiUrl','String'], ['apiKey','String'], ['authType','String'], ['extraConfig','Map_String_Object'], ['callbackSecretConfigured','Boolean'], ['enabled','Boolean'], ['lastSyncAt','LocalDateTime'], ['lastSyncStatus','String']],
  ExternalSourceSummaryResponse: [['id','Long'], ['sourceCode','String'], ['sourceName','String'], ['sourceType','String'], ['apiUrl','String'], ['authType','String'], ['callbackSecretConfigured','Boolean'], ['enabled','Boolean'], ['lastSyncAt','LocalDateTime'], ['lastSyncStatus','String']],
  FondsOptionResponse: [['id','Long'], ['fondsNo','String'], ['fondsName','String']],
  FondsResponse: [['id','Long'], ['fondsNo','String'], ['fondsName','String'], ['fondsType','String'], ['description','String'], ['status','String'], ['createdAt','LocalDateTime']],
  FondsSummaryResponse: [['id','Long'], ['fondsNo','String'], ['fondsName','String'], ['fondsType','String'], ['description','String'], ['status','String']],
  LocationOptionResponse: [['id','Long'], ['locationName','String'], ['roomName','String'], ['shelfNo','String']],
  LocationSummaryResponse: [['id','Long'], ['locationCode','String'], ['locationName','String'], ['roomName','String'], ['area','String'], ['shelfNo','String'], ['layerNo','String'], ['totalCapacity','Integer'], ['usedCapacity','Integer'], ['status','String']],
  LoginResponse: [['accessToken','String'], ['refreshToken','String'], ['expiresIn','Long'], ['userId','Long'], ['username','String'], ['realName','String'], ['userType','String']],
  MonthlyTrendStatisticsResponse: [['month','int'], ['monthName','String'], ['count','long']],
  OperationLogResponse: [['id','Long'], ['archiveId','Long'], ['objectType','String'], ['objectId','String'], ['operationType','String'], ['operationDesc','String'], ['operatorId','Long'], ['operatorName','String'], ['operatorIp','String'], ['operatorUa','String'], ['operatedAt','LocalDateTime'], ['operationDetail','Map_String_Object']],
  OperationLogSummaryResponse: [['id','Long'], ['objectType','String'], ['objectId','String'], ['operationType','String'], ['operationDesc','String'], ['operatorName','String'], ['operatorIp','String'], ['operatedAt','LocalDateTime']],
  OverviewStatisticsResponse: [['totalArchives','long'], ['monthlyNew','long'], ['totalFiles','long'], ['borrowing','long'], ['pendingApproval','long']],
  PublicSiteConfigResponse: [['configKey','String'], ['configValue','String']],
  PushRecordResponse: [['id','Long'], ['pushBatchNo','String'], ['sourceType','String'], ['sourceId','String'], ['archiveId','Long'], ['archiveNo','String'], ['title','String'], ['pushStatus','String'], ['totalFiles','Integer'], ['successFiles','Integer'], ['errorMessage','String'], ['pushedAt','LocalDateTime'], ['processedAt','LocalDateTime']],
  PushRecordSummaryResponse: [['id','Long'], ['pushBatchNo','String'], ['sourceType','String'], ['archiveId','Long'], ['archiveNo','String'], ['title','String'], ['pushStatus','String'], ['totalFiles','Integer'], ['successFiles','Integer'], ['pushedAt','LocalDateTime']],
  RestoreJobResponse: [['restoreNo','String'], ['targetName','String'], ['backupSetName','String'], ['status','String'], ['statusMessage','String'], ['followUpRequired','boolean'], ['verifyStatus','String'], ['rebuildIndexStatus','String'], ['restoreReport','String'], ['createdAt','LocalDateTime']],
  Result: [['success','Boolean'], ['code','String'], ['message','String'], ['data','T']],
  RetentionArchiveResponse: [['id','Long'], ['archiveNo','String'], ['title','String'], ['retentionPeriod','String'], ['retentionExpireDate','LocalDate']],
  RetentionStatisticsResponse: [['period','String'], ['name','String'], ['count','long']],
  RoleOptionResponse: [['id','Long'], ['roleName','String'], ['description','String'], ['status','String']],
  RoleResponse: [['id','Long'], ['roleCode','String'], ['roleName','String'], ['description','String'], ['status','String'], ['createdAt','LocalDateTime']],
  ScanBatchStatisticsResponse: [['scanBatchNo','String'], ['fileCount','long'], ['archiveCount','long'], ['scannedFileCount','long'], ['passedCount','long'], ['pendingCount','long'], ['failedCount','long'], ['reviewedCount','long'], ['scanCoverageRate','double'], ['reviewCompletionRate','double'], ['passRate','double'], ['latestScanTime','Object']],
  StatusStatisticsResponse: [['status','String'], ['name','String'], ['count','long']],
  StorageStatisticsResponse: [['totalSize','long'], ['totalSizeFormatted','String'], ['fileCount','long']],
  SysConfigResponse: [['configKey','String'], ['configValue','String'], ['configType','String'], ['configGroup','String'], ['description','String'], ['editable','Boolean'], ['sortOrder','Integer']],
  SystemRuntimeInfoDTO: [['applicationName','String'], ['productVersion','String'], ['backendVersion','String'], ['commitSha','String'], ['buildTime','String']],
  UserResponse: [['id','Long'], ['username','String'], ['realName','String'], ['email','String'], ['phone','String'], ['department','String'], ['userType','String'], ['status','String'], ['createdAt','LocalDateTime']],
};

/* ---------------- 集合 -> 类型 ---------------- */
const COLLECTION_TYPE = {
  'archives': 'ArchiveDTO',
  'appraisals': 'AppraisalRecordSummaryResponse',
  'borrows': 'BorrowApplicationSummaryResponse',
  'borrow-links': 'BorrowLinkSummaryResponse',
  'destructions': 'DestructionRecordSummaryResponse',
  'fonds': 'FondsSummaryResponse',
  'locations': 'LocationSummaryResponse',
  'categories': 'CategoryResponse',
  'users': 'UserResponse',
  'roles': 'RoleResponse',
  'configs': 'SysConfigResponse',
  'push-records': 'PushRecordSummaryResponse',
  'operation-logs': 'OperationLogSummaryResponse',
  'backup-jobs': 'BackupJobResponse',
  'backup-sets': 'BackupSetResponse',
  'backup-targets': 'BackupTargetSummaryResponse',
  'restore-jobs': 'RestoreJobResponse',
  'retention': 'RetentionArchiveResponse',
  'dead-letters': 'DeadLetterRecordResponse',
  'sources': 'ExternalSourceSummaryResponse'
};

/* ---------------- 字段值生成 ---------------- */
function mkVal(name, type, idx) {
  const t = type || 'String';
  const n = name || '';

  // 主键
  if (n === 'id') return idx + 1;

  // 布尔
  if (t === 'Boolean' || t === 'boolean') {
    if (/has|enabled|active|deleted/i.test(n)) return /has/.test(n) ? idx % 2 === 0 : true;
    return Math.random() < 0.5;
  }

  // 数字
  if (/^(Long|Integer|int|long|Double|Float|double|float|Short|BigDecimal)$/.test(t)) {
    if (/count|Count$/.test(n)) return ri(0, 999);
    if (/pageCount|piecesCount|fileCount/.test(n)) return ri(1, 200);
    if (/size|Size$/.test(n)) return ri(1024, 104857600);
    if (/level|Level$/.test(n)) return ri(1, 3);
    if (/amount|Amount$/.test(n)) return ri(1000, 999999);
    if (/days|Days$/.test(n)) return ri(1, 365);
    return ri(1, 9999);
  }

  // 日期时间
  if (/LocalDate|LocalDateTime|Date/.test(t) || /(Date|Time|At)$/.test(n)) {
    if (/LocalDateTime|Time$|At$/.test(t + n)) return hoursAgo(ri(1, 720));
    return daysAgo(ri(1, 900));
  }

  // 列表
  if (/^List|^Set/.test(t)) return [];

  // 字符串：按字段名语义生成
  // 枚举字段
  if (n === 'status') {
    if (/borrow/i.test(n)) return pick(ENUM.BORROW_STATUS);
    return pick(ENUM.ARCHIVE_STATUS);
  }
  if (n === 'securityLevel') return pick(ENUM.SECURITY_LEVELS);
  if (n === 'archiveType') return pick(ENUM.ARCHIVE_TYPES);
  if (n === 'archiveForm') return pick(ENUM.ARCHIVE_FORMS);
  if (n === 'retentionPeriod') return pick(ENUM.RETENTION_PERIODS);
  if (n === 'userType') return pick(ENUM.USER_TYPES);
  if (n === 'borrowType') return pick(['ELECTRONIC', 'PHYSICAL']);

  // 编号
  if (/No$/.test(n)) {
    if (/archive/i.test(n)) return 'WS-2026-' + pad(idx + 1, 4);
    if (/application/i.test(n)) return 'JY-2026-' + pad(idx + 1, 4);
    if (/fonds/i.test(n)) return 'QZ-' + pad(idx + 1, 3);
    if (/category/i.test(n)) return 'FL-' + pad(idx + 1, 3);
    if (/case/i.test(n)) return '(2026)黔01民初' + pad(idx + 1, 4) + '号';
    if (/batch/i.test(n)) return 'SM-2026-' + pad(idx + 1, 3);
    return 'NO-' + pad(idx + 1, 6);
  }

  // 名称
  if (/Name$/.test(n)) {
    if (/lawyer/i.test(n)) return '李' + pick(GIVEN);
    if (/client/i.test(n)) return pick(CLIENTS);
    if (/applicant|operator|userName|realName|createdBy|updatedBy|reviewer|auditor/i.test(n)) return fullName();
    if (/category/i.test(n)) return pick(['文书档案类','合同档案类','诉讼档案类','人事档案类','财务档案类']);
    if (/fonds/i.test(n)) return pick(['综合档案全宗','业务档案全宗','财务档案全宗']);
    if (/dept|department/i.test(n)) return pick(DEPTS);
    if (/role/i.test(n)) return pick(['系统管理员','档案管理员','档案审核员','安全保密员','普通用户']);
    if (/status|period|type|level|form/i.test(n)) return pick(['正常','启用','永久','公开']);
    return pick(CASE_TYPE);
  }
  if (n === 'title' || n === 'archiveTitle' || n === 'caseName') {
    return pick(CLIENTS).slice(0, 8) + pick(CASE_TYPE) + '案卷材料';
  }
  if (n === 'department' || n === 'applicantDept') return pick(DEPTS);
  if (n === 'clientName') return pick(CLIENTS);
  if (/email/i.test(n)) return 'user' + (idx + 1) + '@lawfirm.demo';
  if (/phone|mobile/i.test(n)) return '13' + String(ri(100000000, 999999999));
  if (/ip|Ip$/.test(n)) return '192.168.1.' + ri(2, 250);
  if (/url|Url$/.test(n)) return 'https://demo.lawfirm.cn/f/' + ri(1000, 9999);
  if (/path/i.test(n)) return '/archive/2026/' + pad(idx + 1, 4);
  if (/code|Code$/.test(n)) return 'C' + pad(idx + 1, 4);
  if (/key|Key$/.test(n)) return 'cfg.key.' + (idx + 1);
  if (/value|Value$/.test(n)) return '配置值' + (idx + 1);
  if (/description|remark|reason|comment|message/i.test(n)) return pick(['正常归档','材料齐全','待补充材料','已完成审核','客户确认无误']);
  if (/username|account/i.test(n)) return 'user' + (idx + 1);

  return pick(CASE_TYPE);
}

/* 按类型生成一条记录 */
function mkRecord(type, idx) {
  const fields = TYPE_FIELDS[type];
  if (!fields) return { id: idx + 1 };
  const rec = {};
  for (const [name, t] of fields) {
    rec[name] = mkVal(name, t, idx);
  }
  return rec;
}

/* ---------------- 集合懒构建 ---------------- */
const _col = new Map();
const SEED_N = {"archives": 5, "appraisals": 5, "borrows": 5, "borrow-links": 5, "destructions": 5, "fonds": 5, "locations": 5, "categories": 5, "users": 5, "roles": 6, "configs": 8, "push-records": 5, "operation-logs": 5, "backup-jobs": 5, "backup-sets": 5, "backup-targets": 3, "restore-jobs": 5, "retention": 5, "dead-letters": 5, "sources": 5};

function getCol(key) {
  if (_col.has(key)) return _col.get(key);
  const type = COLLECTION_TYPE[key];
  if (!type) return null;
  const n = SEED_N[key] || 5;
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(mkRecord(type, i));
  enrich(key, arr);
  _col.set(key, arr);
  return arr;
}

/* 集合级修正：保证关联字段自洽、枚举与页面一致 */
function enrich(key, arr) {
  if (key === 'archives') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.archiveNo = 'WS-2026-' + pad(i + 1, 4);
      r.status = i === 0 ? 'STORED' : (i === 1 ? 'PENDING_REVIEW' : pick(['STORED', 'RECEIVED', 'CATALOGING', 'BORROWED']));
      r.securityLevel = i === 0 ? 'PUBLIC' : pick(ENUM.SECURITY_LEVELS);
      r.archiveType = pick(ENUM.ARCHIVE_TYPES);
      r.archiveForm = pick(ENUM.ARCHIVE_FORMS);
      r.hasElectronic = true;
      r.hasPhysical = i % 2 === 0;
      r.fileCount = ri(1, 12);
      r.createdAt = hoursAgo(ri(1, 500));
    });
  }
  if (key === 'borrows') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.applicationNo = 'JY-2026-' + pad(i + 1, 4);
      r.status = i === 0 ? 'PENDING' : (i === 1 ? 'APPROVED' : pick(ENUM.BORROW_STATUS));
      r.applicantName = fullName();
      r.archiveTitle = pick(CLIENTS).slice(0, 8) + pick(CASE_TYPE) + '案卷材料';
    });
  }
  if (key === 'users') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.username = ['admin', 'archivist', 'reviewer', 'auditor', 'user'][i] || ('user' + (i + 1));
      r.realName = fullName();
      r.userType = ['SYSTEM_ADMIN', 'ARCHIVE_MANAGER', 'ARCHIVE_REVIEWER', 'AUDIT_ADMIN', 'USER'][i] || 'USER';
      r.status = 'ACTIVE';
      r.department = pick(DEPTS);
    });
  }
  if (key === 'categories') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.parentId = i === 0 ? null : (i < 3 ? 1 : pick([1, 2, 3]));
      r.level = r.parentId ? 2 : 1;
      r.children = [];
      r.status = 'ACTIVE';
    });
  }
  if (key === 'configs') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.status = 'ACTIVE';
      if (/secret|password|token|key/i.test(r.configKey || '')) r.configValue = '******';
    });
  }
  if (key === 'appraisals') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.status = i === 0 ? 'PENDING' : (i === 1 ? 'APPROVED' : pick(['IN_PROGRESS', 'COMPLETED', 'REJECTED', 'PENDING', 'APPROVED']));
      r.appraiserName = fullName();
      r.appraisedAt = hoursAgo(ri(1, 200));
    });
  }
  if (key === 'destructions') {
    arr.forEach((r, i) => {
      r.id = i + 1;
      r.status = i === 0 ? 'PENDING' : (i === 1 ? 'APPROVED' : pick(['IN_PROGRESS', 'COMPLETED', 'REJECTED', 'PENDING', 'APPROVED']));
      r.applicantName = fullName();
    });
  }
}

/* ---------------- 响应包装 ---------------- */
function ok(data) {
  return { success: true, code: '200', message: 'success', data: data === undefined ? null : data };
}
function fail(message, code) {
  return { success: false, code: code || '500', message: message || '操作失败', data: null };
}
function paginate(arr, params) {
  const pageNum = Number(params.get('pageNum') || params.get('current') || 1) || 1;
  const pageSize = Number(params.get('pageSize') || params.get('size') || 20) || 20;
  const total = arr.length;
  const start = (pageNum - 1) * pageSize;
  const records = arr.slice(start, start + pageSize);
  return {
    current: pageNum,
    size: pageSize,
    total: total,
    pages: total === 0 ? 0 : Math.ceil(total / pageSize),
    records: records,
  };
}

/* ---------------- 当前登录用户 ---------------- */
const DEMO_USER = {
  accessToken: 'demo-access-token',
  refreshToken: 'demo-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 86400000,
  userId: 1,
  username: 'admin',
  realName: '系统管理员',
  userType: 'SYSTEM_ADMIN',
};

/* ---------------- 路由 ---------------- */
function routeApi(method, path, params, body) {
  const p = path.replace(/^\/api/, '');

  /* --- 认证 --- */
  if (p === '/auth/login') {
    return ok(Object.assign({}, DEMO_USER, {
      username: (body && body.username) || 'admin',
      realName: '系统管理员',
      userType: 'SYSTEM_ADMIN',
    }));
  }
  if (p === '/auth/refresh') return ok(DEMO_USER);
  if (p === '/auth/me') return ok(DEMO_USER);
  if (p === '/auth/logout') return ok(null);
  if (p === '/auth/bootstrap/status') return ok({ initialized: true, needsBootstrap: false });

  /* --- 用户 --- */
  if (p === '/users/current') {
    const u = getCol('users')[0];
    return ok(Object.assign({ roles: ['SYSTEM_ADMIN'] }, u));
  }

  /* --- 统计：全部由明细实算 --- */
  if (p === '/statistics/overview') {
    const a = getCol('archives');
    const b = getCol('borrows');
    return ok({
      totalArchives: a.length,
      storedArchives: a.filter((x) => x.status === 'STORED').length,
      pendingReview: a.filter((x) => x.status === 'PENDING_REVIEW').length,
      borrowedArchives: a.filter((x) => x.status === 'BORROWED').length,
      totalBorrows: b.length,
      pendingBorrows: b.filter((x) => x.status === 'PENDING').length,
      overdueBorrows: b.filter((x) => x.status === 'OVERDUE').length,
      totalFiles: a.reduce((s, x) => s + (Number(x.fileCount) || 0), 0),
    });
  }
  if (p === '/statistics/by-status') {
    const a = getCol('archives');
    const map = {};
    a.forEach((x) => { map[x.status] = (map[x.status] || 0) + 1; });
    const NAME = { DRAFT: '草稿', PENDING_REVIEW: '待审核', RECEIVED: '已接收', CATALOGING: '整理中', STORED: '已归档', BORROWED: '借出中', DESTROYED: '已销毁', REJECTED: '已退回', PROCESSING: '处理中', PARTIAL: '部分完成', FAILED: '处理失败' };
    return ok(Object.keys(map).map((k) => ({ status: k, name: NAME[k] || k, count: map[k] })));
  }
  if (p === '/statistics/by-type') {
    const a = getCol('archives');
    const NAME = { DOCUMENT: '文书档案', SCIENCE: '科技档案', ACCOUNTING: '会计档案', PERSONNEL: '人事档案', SPECIAL: '专业档案', AUDIOVISUAL: '声像档案', LITIGATION: '诉讼档案', NON_LITIGATION: '非诉档案', CONTRACT: '合同档案' };
    const map = {};
    a.forEach((x) => { map[x.archiveType] = (map[x.archiveType] || 0) + 1; });
    return ok(Object.keys(map).map((k) => ({ archiveType: k, name: NAME[k] || k, count: map[k] })));
  }
  if (p === '/statistics/by-retention') {
    const a = getCol('archives');
    const NAME = { PERMANENT: '永久', LONG_TERM: '长期', SHORT_TERM: '短期', TEMPORARY: '临时' };
    const map = {};
    a.forEach((x) => { map[x.retentionPeriod] = (map[x.retentionPeriod] || 0) + 1; });
    return ok(Object.keys(map).map((k) => ({ period: k, name: NAME[k] || k, count: map[k] })));
  }
  if (p === '/statistics/trend') {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        month: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
        archiveCount: ri(3, 30),
        borrowCount: ri(1, 12),
        count: ri(3, 30),
      });
    }
    return ok(out);
  }
  if (p === '/statistics/storage') {
    const a = getCol('archives');
    const total = a.reduce((s, x) => s + (Number(x.totalFileSize) || 0), 0);
    return ok({ totalSize: total, fileCount: a.reduce((s, x) => s + (Number(x.fileCount) || 0), 0), archiveCount: a.length });
  }
  if (p === '/statistics/scan-batches') {
    return ok(getCol('archives').map((x) => ({ batchNo: x.scanBatchNo, name: x.scanBatchNo, count: ri(1, 50) })));
  }
  if (p === '/statistics/borrow') {
    const b = getCol('borrows') || [];
    return ok({
      total: b.length,
      pending: b.filter((x) => /PENDING/i.test(x.status || '')).length,
      approved: b.filter((x) => /APPROVED/i.test(x.status || '')).length,
      overdue: b.filter((x) => /OVERDUE/i.test(x.status || '')).length,
      returned: b.filter((x) => /RETURNED/i.test(x.status || '')).length,
    });
  }
  if (/^\/statistics\//.test(p)) return ok([]);

  /* --- 嵌套路径别名：前端用复数嵌套，集合键用连字符 --- */
  if (method === 'GET') {
    const ALIAS = {
      '/backups/jobs': 'backup-jobs',
      '/backups/sets': 'backup-sets',
      '/backups/targets': 'backup-targets',
      '/restores/jobs': 'restore-jobs',
      '/restores/sets': 'backup-sets',
    };
    if (ALIAS[p]) {
      const arr = getCol(ALIAS[p]) || [];
      if (ARRAY_ENDPOINTS[p]) return ok(arr.slice());
      return ok(paginate(arr, params));
    }
    let am = /^\/([a-z-]+)\/([a-z-]+)\/(\d+)$/.exec(p);
    if (am && ALIAS['/' + am[1] + '/' + am[2]]) {
      const arr = getCol(ALIAS['/' + am[1] + '/' + am[2]]) || [];
      return ok(arr.find((x) => String(x.id) === am[3]) || arr[0] || {});
    }
    /* 备份/恢复 汇总对象 */
    if (p === '/backups/overview') {
      const t = getCol('backup-targets') || [], j = getCol('backup-jobs') || [];
      return ok({
        totalTargets: t.length, healthyTargets: t.length, totalJobs: j.length,
        successJobs: j.filter((x) => x.status === 'SUCCESS').length,
        failedJobs: j.filter((x) => x.status === 'FAILED').length,
        runningJobs: j.filter((x) => x.status === 'RUNNING').length,
        lastBackupTime: (j[0] && j[0].endTime) || null,
      });
    }
    if (p === '/restores/maintenance') return ok({ enabled: true, lastMaintenanceTime: null, nextMaintenanceTime: null });
    /* 文件预览/下载（演示返回占位） */
    if (/^\/archives\/files\/\d+\/(download-url|preview-url)$/.test(p)) return ok({ url: 'data:application/octet-stream;base64,', expiresAt: Date.now() + 3600000 });
    if (/^\/files\/\d+\/preview-info$/.test(p)) return ok({ previewAvailable: true, previewType: 'image', url: '', thumbnailUrl: '', fileType: 'image/png' });
    /* 配置子对象（按大写 configKey 取值） */
    if (/^\/configs\/[A-Z_][A-Z0-9_]*$/.test(p)) {
      const arr = getCol('configs') || [];
      const k = p.split('/')[2];
      return ok(arr.find((x) => x.configKey === k) || arr[0] || {});
    }
    /* 借阅链接 / 操作日志 汇总对象 */
    if (p === '/borrow-links/stats') {
      const b = getCol('borrow-links') || [];
      return ok({ total: b.length, active: b.filter((x) => x.status === 'ACTIVE').length, expired: b.filter((x) => x.status === 'EXPIRED').length });
    }
    if (p === '/operation-logs/statistics') return ok({ total: (getCol('operation-logs') || []).length, byType: {} });
    if (p === '/operation-logs/export') return ok({ url: '', fileName: 'operation-logs.csv' });
    /* 站点公开配置（前端按 configKey->configValue 数组解析） */
    if (p === '/configs/public/site') {
      return ok([
        { configKey: 'system.site.name', configValue: '智慧律所档案管理系统' },
        { configKey: 'system.site.name.en', configValue: 'Archive Management System' },
        { configKey: 'system.site.logo', configValue: './logo.png' },
        { configKey: 'system.site.icp', configValue: '' },
        { configKey: 'system.site.copyright', configValue: '© 2024 智慧律所档案管理系统 · 演示站' },
      ]);
    }
    /* 详情按 archiveNo 检索 */
    let an = /^\/archives\/no\/([^/]+)$/.exec(p);
    if (an) return ok(getCol('archives').find((x) => x.archiveNo === an[1]) || getCol('archives')[0] || {});
  }

  /* --- 分类树 --- */
  if (p === '/categories/tree' || p === '/categories/tree/summary') {
    return ok(buildTree(getCol('categories')));
  }
  /* --- 位置房间号（List<String>）--- */
  if (p === '/locations/rooms') return ok(['A101', 'A102', 'B201', 'B202', 'C301']);
  /* --- 用户角色（List<Long>）--- */
  if (/^\/users\/\d+\/roles$/.test(p)) return ok([1, 2]);

  /* --- 写操作：一律成功 --- */
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    if (/^\/archives\/\d+$/.test(p) && method === 'GET') {
      return ok(getCol('archives')[0] || {});
    }
    return ok(null);
  }

  /* --- 单条详情 GET /xxx/{id} --- */
  let m = /^\/([a-z-]+)\/(\d+)$/.exec(p);
  if (m) {
    const arr = getCol(m[1]);
    if (arr) {
      const one = arr.find((x) => String(x.id) === m[2]) || arr[0];
      return ok(one || {});
    }
  }

  /* --- 集合列表 --- */
  // 精确集合名（含连字符）
  for (const key of Object.keys(COLLECTION_TYPE)) {
    if (p === '/' + key) {
      const arr = getCol(key) || [];
      // 该端点若后端声明为裸数组，则直接返回数组
      if (ARRAY_ENDPOINTS[p]) return ok(arr.slice());
      return ok(paginate(arr, params));
    }
  }
  // 子路径：/borrows/pending 等，从主集合过滤
  const seg = p.split('/')[1];
  if (COLLECTION_TYPE[seg]) {
    const arr = getCol(seg) || [];
    const sub = p.split('/').slice(2).join('/');
    if (sub && !/^\d+$/.test(sub)) {
      let filtered = arr;
      if (sub === 'pending') filtered = arr.filter((x) => /PENDING/i.test(x.status || ''));
      else if (sub === 'approved') filtered = arr.filter((x) => /APPROVED/i.test(x.status || ''));
      else if (sub === 'failed') filtered = arr.filter((x) => /FAILED/i.test(x.status || ''));
      else if (sub === 'my' || sub === 'overdue') filtered = arr;
      else if (sub === 'available') filtered = arr.filter((x, i) => i % 2 === 0);
      else if (sub === 'options') return ok(arr.slice(0, 10));
      else if (sub === 'list') return ok(arr.slice());
      else filtered = arr;
      return ok(paginate(filtered, params));
    }
  }

  /* --- 未命中：返回空 --- */
  return ok(null);
}

/* 后端声明为裸数组的端点（非分页） */
const ARRAY_ENDPOINTS = {
  '/backups/sets': true, '/restores/sets': true, '/backups/targets': true,
  '/fonds': true, '/roles': true, '/roles/options': true,
  '/configs': false, '/configs/list': true, '/configs/system': true,
  '/configs/retention': true, '/configs/archive-no': true, '/configs/public/site': true,
  '/locations/available': true,
  '/push-records/pending': true, '/push-records/failed': true,
  '/borrows/overdue': true,
  '/retention/expired': true, '/retention/expiring': true,
  '/categories/tree': true, '/categories/tree/summary': true,
};

function buildTree(flat) {
  const byId = new Map();
  flat.forEach((r) => byId.set(r.id, Object.assign({}, r, { children: [] })));
  const roots = [];
  byId.forEach((r) => {
    if (r.parentId && byId.has(r.parentId)) byId.get(r.parentId).children.push(r);
    else roots.push(r);
  });
  return roots;
}

/* ---------------- 导出给页面内拦截层使用 ---------------- */
if (typeof self !== 'undefined') {
  self.__archiveMock = {
    version: SW_VERSION,
    route: function (method, path, params, body) {
      try {
        return routeApi(method, path, params instanceof URLSearchParams ? params : new URLSearchParams(params || ''), body);
      } catch (e) {
        return fail(String((e && e.message) || e));
      }
    },
  };
}
