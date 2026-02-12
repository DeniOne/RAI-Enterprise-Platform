[01:52:22] File change detected. Starting incremental compilation...

src/app.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/app.module.ts:2:31 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

2 import { GraphQLModule } from "@nestjs/graphql";
                                ~~~~~~~~~~~~~~~~~

src/app.module.ts:3:50 - error TS2307: Cannot find module '@nestjs/apollo' or its corresponding type declarations.

3 import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
                                                   ~~~~~~~~~~~~~~~~

src/app.module.ts:4:30 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

4 import { ConfigModule } from "@nestjs/config";
                               ~~~~~~~~~~~~~~~~

src/app.module.ts:5:32 - error TS2307: Cannot find module '@nestjs/schedule' or its corresponding type declarations.

5 import { ScheduleModule } from "@nestjs/schedule";
                                 ~~~~~~~~~~~~~~~~~~

src/app.module.ts:6:49 - error TS2307: Cannot find module '@nestjs/throttler' or its corresponding type declarations.

6 import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
                                                  ~~~~~~~~~~~~~~~~~~~

src/app.module.ts:7:27 - error TS2307: Cannot find module '@nestjs/core' or its corresponding type declarations.

7 import { APP_GUARD } from "@nestjs/core";
                            ~~~~~~~~~~~~~~

src/main.ts:1:29 - error TS2307: Cannot find module '@nestjs/core' or its corresponding type declarations.

1 import { NestFactory } from "@nestjs/core";
                              ~~~~~~~~~~~~~~

src/main.ts:3:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

3 import { ValidationPipe } from "@nestjs/common";
                                 ~~~~~~~~~~~~~~~~

src/main.ts:4:48 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

4 import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
                                                 ~~~~~~~~~~~~~~~~~

src/modules/advisory/advisory.controller.ts:10:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

10 } from "@nestjs/common";
          ~~~~~~~~~~~~~~~~

src/modules/advisory/advisory.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/advisory/advisory.service.ts:7:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

7 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/agro-audit/agro-audit.module.ts:1:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module, Global } from "@nestjs/common";
                                 ~~~~~~~~~~~~~~~~

src/modules/agro-audit/agro-audit.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/agro-orchestrator/agro-orchestrator.controller.ts:9:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

9 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/agro-orchestrator/agro-orchestrator.controller.ts:15:8 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

15 } from "@nestjs/swagger";
          ~~~~~~~~~~~~~~~~~

src/modules/agro-orchestrator/agro-orchestrator.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/agro-orchestrator/agro-orchestrator.service.ts:5:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/client-registry/client-registry.controller.ts:9:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

9 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/client-registry/client-registry.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/client-registry/client-registry.service.ts:6:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

6 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/cmr/cmr.controller.ts:1:63 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
                                                                ~~~~~~~~~~~~~~~~

src/modules/cmr/cmr.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/cmr/decision.service.ts:1:48 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, ForbiddenException } from '@nestjs/common';
                                                 ~~~~~~~~~~~~~~~~

src/modules/cmr/deviation.service.ts:1:68 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
                                                                     ~~~~~~~~~~~~~~~~

src/modules/cmr/deviation.service.ts:4:38 - error TS2307: Cannot find module '@nestjs/schedule' or its corresponding type declarations.

4 import { Cron, CronExpression } from '@nestjs/schedule';
                                       ~~~~~~~~~~~~~~~~~~

src/modules/cmr/risk.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/consulting/consulting.controller.ts:1:70 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
                                                                       ~~~~~~~~~~~~~~~~

src/modules/consulting/consulting.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/consulting/consulting.service.ts:1:96 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from "@nestjs/common";
                                                                                                 ~~~~~~~~~~~~~~~~

src/modules/crm/crm.controller.ts:10:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

10 } from "@nestjs/common";
          ~~~~~~~~~~~~~~~~

src/modules/crm/crm.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/crm/crm.service.ts:6:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

6 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/field-observation/field-observation.controller.ts:1:51 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Param, UseGuards } from "@nestjs/common";
                                                    ~~~~~~~~~~~~~~~~

src/modules/field-observation/field-observation.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/field-observation/field-observation.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/field-registry/field-registry.controller.ts:8:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

8 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/field-registry/field-registry.controller.ts:11:27 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

11 import { AuthGuard } from "@nestjs/passport";
                             ~~~~~~~~~~~~~~~~~~

src/modules/field-registry/field-registry.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/field-registry/field-registry.service.ts:5:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/finance-economy/economy/application/economy.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from '@nestjs/common';
                                     ~~~~~~~~~~~~~~~~

src/modules/finance-economy/economy/economy.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/finance-economy/finance-economy.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/finance-economy/finance/application/budget.service.ts:1:76 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
                                                                             ~~~~~~~~~~~~~~~~

src/modules/finance-economy/finance/application/finance.service.ts:1:76 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
                                                                             ~~~~~~~~~~~~~~~~

src/modules/finance-economy/finance/application/liquidity-forecast.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from '@nestjs/common';
                                     ~~~~~~~~~~~~~~~~

src/modules/finance-economy/finance/finance.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/finance-economy/integrations/application/integration.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from '@nestjs/common';
                                     ~~~~~~~~~~~~~~~~

src/modules/finance-economy/integrations/integrations.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/finance-economy/ofs/application/ofs.controller.ts:1:57 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Req, UseGuards, Logger } from '@nestjs/common';
                                                          ~~~~~~~~~~~~~~~~

src/modules/finance-economy/ofs/ofs.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/hr/development/assessment.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/hr/development/development.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/hr/development/pulse.controller.ts:1:61 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
                                                              ~~~~~~~~~~~~~~~~

src/modules/hr/development/pulse.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/hr/foundation/employee.service.ts:1:48 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, ForbiddenException } from '@nestjs/common';
                                                 ~~~~~~~~~~~~~~~~

src/modules/hr/foundation/foundation.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/hr/hr-orchestrator.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from '@nestjs/common';
                                     ~~~~~~~~~~~~~~~~

src/modules/hr/hr.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/hr/incentive/incentive.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/hr/incentive/kpi.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/hr/incentive/okr.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/hr/incentive/recognition.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/hr/incentive/reward.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/identity-registry/identity-registry.controller.ts:11:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

11 } from "@nestjs/common";
          ~~~~~~~~~~~~~~~~

src/modules/identity-registry/identity-registry.controller.ts:14:27 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

14 import { AuthGuard } from "@nestjs/passport";
                             ~~~~~~~~~~~~~~~~~~

src/modules/identity-registry/identity-registry.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/identity-registry/identity-registry.service.ts:5:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/integrity/integrity-gate.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/integrity/integrity-gate.service.ts:6:38 - error TS2307: Cannot find module '@nestjs/schedule' or its corresponding type declarations.

6 import { Cron, CronExpression } from "@nestjs/schedule";
                                       ~~~~~~~~~~~~~~~~~~

src/modules/integrity/integrity.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/integrity/integrity.module.ts:7:32 - error TS2307: Cannot find module '@nestjs/schedule' or its corresponding type declarations.

7 import { ScheduleModule } from "@nestjs/schedule";
                                 ~~~~~~~~~~~~~~~~~~

src/modules/integrity/integrity.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/integrity/registry-agent.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/knowledge-graph/knowledge-graph-event-handler.service.ts:2:37 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 ﻿import { Injectable, Logger } from "@nestjs/common";
  ﻿                                   ~~~~~~~~~~~~~~~~

src/modules/knowledge-graph/knowledge-graph-ingestion.service.ts:2:58 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 ﻿import { BadRequestException, Injectable, Logger } from "@nestjs/common";
  ﻿                                                        ~~~~~~~~~~~~~~~~

src/modules/knowledge-graph/knowledge-graph-query.service.ts:2:29 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 ﻿import { Injectable } from "@nestjs/common";
  ﻿                           ~~~~~~~~~~~~~~~~

src/modules/knowledge-graph/knowledge-graph.event-bus.ts:2:29 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 ﻿import { Injectable } from "@nestjs/common";
  ﻿                           ~~~~~~~~~~~~~~~~

src/modules/knowledge-graph/knowledge-graph.module.ts:2:25 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 ﻿import { Module } from "@nestjs/common";
  ﻿                       ~~~~~~~~~~~~~~~~

src/modules/knowledge/knowledge.controller.ts:1:60 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
                                                             ~~~~~~~~~~~~~~~~

src/modules/knowledge/knowledge.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/knowledge/knowledge.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/legal/controllers/gr.controller.ts:1:52 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Body, Query } from '@nestjs/common';
                                                     ~~~~~~~~~~~~~~~~

src/modules/legal/controllers/legal.controller.ts:1:70 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
                                                                       ~~~~~~~~~~~~~~~~

src/modules/legal/legal.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/legal/services/compliance.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/rapeseed/dto/create-rapeseed.input.ts:1:46 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, Int, Float } from "@nestjs/graphql";
                                               ~~~~~~~~~~~~~~~~~

src/modules/rapeseed/dto/rapeseed.type.ts:7:8 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

7 } from "@nestjs/graphql";
         ~~~~~~~~~~~~~~~~~

src/modules/rapeseed/dto/update-rapeseed.input.ts:1:47 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, PartialType } from "@nestjs/graphql";
                                                ~~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.resolver.ts:1:56 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { Resolver, Query, Mutation, Args, Float } from "@nestjs/graphql";
                                                         ~~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.resolver.ts:2:27 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { UseGuards } from "@nestjs/common";
                            ~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:6:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

6 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:96:31 - error TS2339: Property 'variety' does not exist on type '{ id: string; }'.

96           variety: updateData.variety ?? currentRapeseed.variety,
                                 ~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:97:36 - error TS2339: Property 'reproduction' does not exist on type '{ id: string; }'.

97           reproduction: updateData.reproduction ?? currentRapeseed.reproduction,
                                      ~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:98:28 - error TS2339: Property 'type' does not exist on type '{ id: string; }'.

98           type: updateData.type ?? currentRapeseed.type,
                              ~~~~

src/modules/rapeseed/rapeseed.service.ts:100:24 - error TS2339: Property 'oilContent' does not exist on type '{ id: string; }'.

100             updateData.oilContent ?? (currentRapeseed as any).oilContent,
                           ~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:102:24 - error TS2339: Property 'erucicAcid' does not exist on type '{ id: string; }'.

102             updateData.erucicAcid ?? (currentRapeseed as any).erucicAcid,
                           ~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:104:24 - error TS2339: Property 'glucosinolates' does not exist on type '{ id: string; }'.

104             updateData.glucosinolates ??
                           ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:107:24 - error TS2339: Property 'vegetationPeriod' does not exist on type '{ id: string; }'.

107             updateData.vegetationPeriod ?? currentRapeseed.vegetationPeriod,
                           ~~~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:109:24 - error TS2339: Property 'sowingNormMin' does not exist on type '{ id: string; }'.

109             updateData.sowingNormMin ?? currentRapeseed.sowingNormMin,
                           ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:111:24 - error TS2339: Property 'sowingNormMax' does not exist on type '{ id: string; }'.

111             updateData.sowingNormMax ?? currentRapeseed.sowingNormMax,
                           ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:113:24 - error TS2339: Property 'sowingDepthMin' does not exist on type '{ id: string; }'.

113             updateData.sowingDepthMin ?? currentRapeseed.sowingDepthMin,
                           ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:115:24 - error TS2339: Property 'sowingDepthMax' does not exist on type '{ id: string; }'.

115             updateData.sowingDepthMax ?? currentRapeseed.sowingDepthMax,
                           ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:230:13 - error TS2339: Property 'sowingNormMin' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingNormMin' does not exist on type 'UpdateRapeseedInput'.

230       input.sowingNormMin &&
                ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:231:13 - error TS2339: Property 'sowingNormMax' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingNormMax' does not exist on type 'UpdateRapeseedInput'.

231       input.sowingNormMax &&
                ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:232:13 - error TS2339: Property 'sowingNormMin' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingNormMin' does not exist on type 'UpdateRapeseedInput'.

232       input.sowingNormMin > input.sowingNormMax
                ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:232:35 - error TS2339: Property 'sowingNormMax' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingNormMax' does not exist on type 'UpdateRapeseedInput'.

232       input.sowingNormMin > input.sowingNormMax
                                      ~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:239:13 - error TS2339: Property 'sowingDepthMin' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingDepthMin' does not exist on type 'UpdateRapeseedInput'.

239       input.sowingDepthMin &&
                ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:240:13 - error TS2339: Property 'sowingDepthMax' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingDepthMax' does not exist on type 'UpdateRapeseedInput'.

240       input.sowingDepthMax &&
                ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:241:13 - error TS2339: Property 'sowingDepthMin' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingDepthMin' does not exist on type 'UpdateRapeseedInput'.

241       input.sowingDepthMin > input.sowingDepthMax
                ~~~~~~~~~~~~~~

src/modules/rapeseed/rapeseed.service.ts:241:36 - error TS2339: Property 'sowingDepthMax' does not exist on type 'CreateRapeseedInput | UpdateRapeseedInput'.
  Property 'sowingDepthMax' does not exist on type 'UpdateRapeseedInput'.

241       input.sowingDepthMin > input.sowingDepthMax
                                       ~~~~~~~~~~~~~~

src/modules/rd/controllers/ExperimentController.ts:1:72 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
                                                                         ~~~~~~~~~~~~~~~~

src/modules/rd/controllers/ProgramController.ts:1:65 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
                                                                  ~~~~~~~~~~~~~~~~

src/modules/rd/controllers/TrialController.ts:1:58 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
                                                           ~~~~~~~~~~~~~~~~

src/modules/rd/rd.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/rd/services/RdService.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/risk/decision.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/risk/risk.controller.ts:1:60 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
                                                             ~~~~~~~~~~~~~~~~

src/modules/risk/risk.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/risk/risk.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from '@nestjs/common';
                                     ~~~~~~~~~~~~~~~~

src/modules/satellite/satellite-event-handler.service.ts:2:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/satellite/satellite-ingestion.service.ts:2:57 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { BadRequestException, Injectable, Logger } from "@nestjs/common";
                                                          ~~~~~~~~~~~~~~~~

src/modules/satellite/satellite-query.service.ts:2:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/modules/satellite/satellite.event-bus.ts:2:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/modules/satellite/satellite.module.ts:2:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/season/dto/create-season.input.ts:1:46 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, Int, Float } from "@nestjs/graphql";
                                               ~~~~~~~~~~~~~~~~~

src/modules/season/dto/season.type.ts:7:8 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

7 } from "@nestjs/graphql";
         ~~~~~~~~~~~~~~~~~

src/modules/season/dto/update-season.input.ts:1:54 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, PartialType, Float } from "@nestjs/graphql";
                                                       ~~~~~~~~~~~~~~~~~

src/modules/season/season.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/season/season.resolver.ts:1:49 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
                                                  ~~~~~~~~~~~~~~~~~

src/modules/season/season.resolver.ts:6:27 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

6 import { UseGuards } from "@nestjs/common";
                            ~~~~~~~~~~~~~~~~

src/modules/season/season.service.ts:5:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/season/season.service.ts:108:15 - error TS2339: Property 'startDate' does not exist on type 'UpdateSeasonInput'.

108     if (input.startDate || input.year || input.rapeseedId) {
                  ~~~~~~~~~

src/modules/season/season.service.ts:108:34 - error TS2339: Property 'year' does not exist on type 'UpdateSeasonInput'.

108     if (input.startDate || input.year || input.rapeseedId) {
                                     ~~~~

src/modules/season/season.service.ts:108:48 - error TS2339: Property 'rapeseedId' does not exist on type 'UpdateSeasonInput'.

108     if (input.startDate || input.year || input.rapeseedId) {
                                                   ~~~~~~~~~~

src/modules/season/services/season-business-rules.service.ts:1:49 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, BadRequestException } from "@nestjs/common";
                                                  ~~~~~~~~~~~~~~~~

src/modules/season/services/season-snapshot.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/modules/strategic/strategic.controller.ts:1:44 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Get, UseGuards } from '@nestjs/common';
                                             ~~~~~~~~~~~~~~~~

src/modules/strategic/strategic.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/strategic/strategic.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/modules/task/dto/create-tasks.input.ts:1:34 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field } from "@nestjs/graphql";
                                   ~~~~~~~~~~~~~~~~~

src/modules/task/dto/task-resource.input.ts:1:41 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, Float } from "@nestjs/graphql";
                                          ~~~~~~~~~~~~~~~~~

src/modules/task/task.controller.ts:9:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

9 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/task/task.controller.ts:16:8 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

16 } from "@nestjs/swagger";
          ~~~~~~~~~~~~~~~~~

src/modules/task/task.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/task/task.resolver.ts:1:42 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { Resolver, Mutation, Args } from "@nestjs/graphql";
                                           ~~~~~~~~~~~~~~~~~

src/modules/task/task.resolver.ts:6:27 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

6 import { UseGuards } from "@nestjs/common";
                            ~~~~~~~~~~~~~~~~

src/modules/task/task.service.ts:5:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/modules/task/types/task-resource.type.ts:1:42 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { ObjectType, Field, Float } from "@nestjs/graphql";
                                           ~~~~~~~~~~~~~~~~~

src/modules/task/types/task.type.ts:1:53 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { ObjectType, Field, registerEnumType } from "@nestjs/graphql";
                                                      ~~~~~~~~~~~~~~~~~

src/modules/tech-map/tech-map.controller.ts:1:70 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Post, Body, Param, Get, Patch, UseGuards } from '@nestjs/common';
                                                                       ~~~~~~~~~~~~~~~~

src/modules/tech-map/tech-map.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

src/modules/tech-map/tech-map.service.ts:1:88 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
                                                                                         ~~~~~~~~~~~~~~~~

src/modules/technology-card/dto/create-technology-card.input.ts:1:46 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { InputType, Field, Int, Float } from "@nestjs/graphql";
                                               ~~~~~~~~~~~~~~~~~

src/modules/technology-card/dto/technology-card.type.ts:1:47 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { ObjectType, Field, Int, Float } from "@nestjs/graphql";
                                                ~~~~~~~~~~~~~~~~~

src/modules/technology-card/technology-card.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/technology-card/technology-card.resolver.ts:1:49 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

1 import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
                                                  ~~~~~~~~~~~~~~~~~

src/modules/technology-card/technology-card.resolver.ts:5:27 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

5 import { UseGuards } from "@nestjs/common";
                            ~~~~~~~~~~~~~~~~

src/modules/technology-card/technology-card.service.ts:1:47 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, NotFoundException } from "@nestjs/common";
                                                ~~~~~~~~~~~~~~~~

src/modules/telegram/progress.service.ts:1:50 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
                                                   ~~~~~~~~~~~~~~~~

src/modules/telegram/progress.service.ts:2:27 - error TS2307: Cannot find module 'nestjs-telegraf' or its corresponding type declarations.

2 import { InjectBot } from "nestjs-telegraf";
                            ~~~~~~~~~~~~~~~~~

src/modules/telegram/telegram-notification.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/telegram/telegram-notification.service.ts:2:27 - error TS2307: Cannot find module 'nestjs-telegraf' or its corresponding type declarations.

2 import { InjectBot } from "nestjs-telegraf";
                            ~~~~~~~~~~~~~~~~~

src/modules/telegram/telegram.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/modules/telegram/telegram.update.ts:1:51 - error TS2307: Cannot find module 'nestjs-telegraf' or its corresponding type declarations.

1 import { Update, Start, Hears, Ctx, Action } from "nestjs-telegraf";
                                                    ~~~~~~~~~~~~~~~~~

src/modules/vision/vision-event-handler.service.ts:2:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/modules/vision/vision-ingestion.service.ts:2:57 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { BadRequestException, Injectable, Logger } from "@nestjs/common";
                                                          ~~~~~~~~~~~~~~~~

src/modules/vision/vision-query.service.ts:2:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/modules/vision/vision.event-bus.ts:2:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/modules/vision/vision.module.ts:2:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

2 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/shared/audit/audit.controller.ts:8:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

8 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/shared/audit/audit.controller.ts:15:8 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

15 } from "@nestjs/swagger";
          ~~~~~~~~~~~~~~~~~

src/shared/audit/audit.module.ts:1:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module, Global } from "@nestjs/common";
                                 ~~~~~~~~~~~~~~~~

src/shared/audit/audit.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/shared/auth/auth.controller.ts:11:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

11 } from "@nestjs/common";
          ~~~~~~~~~~~~~~~~

src/shared/auth/auth.controller.ts:14:27 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

14 import { AuthGuard } from "@nestjs/passport";
                             ~~~~~~~~~~~~~~~~~~

src/shared/auth/auth.controller.ts:15:67 - error TS2307: Cannot find module '@nestjs/swagger' or its corresponding type declarations.

15 import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
                                                                     ~~~~~~~~~~~~~~~~~

src/shared/auth/auth.controller.ts:16:26 - error TS2307: Cannot find module '@nestjs/throttler' or its corresponding type declarations.

16 import { Throttle } from "@nestjs/throttler";
                            ~~~~~~~~~~~~~~~~~~~

src/shared/auth/auth.guard.ts:1:46 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, ExecutionContext } from "@nestjs/common";
                                               ~~~~~~~~~~~~~~~~

src/shared/auth/auth.guard.ts:2:27 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

2 import { AuthGuard } from "@nestjs/passport";
                            ~~~~~~~~~~~~~~~~~~

src/shared/auth/auth.guard.ts:3:37 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

3 import { GqlExecutionContext } from "@nestjs/graphql";
                                      ~~~~~~~~~~~~~~~~~

src/shared/auth/auth.module.ts:1:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module } from "@nestjs/common";
                         ~~~~~~~~~~~~~~~~

src/shared/auth/auth.module.ts:2:27 - error TS2307: Cannot find module '@nestjs/jwt' or its corresponding type declarations.

2 import { JwtModule } from "@nestjs/jwt";
                            ~~~~~~~~~~~~~

src/shared/auth/auth.module.ts:3:32 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

3 import { PassportModule } from "@nestjs/passport";
                                 ~~~~~~~~~~~~~~~~~~

src/shared/auth/auth.module.ts:12:45 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

12 import { ConfigModule, ConfigService } from "@nestjs/config";
                                               ~~~~~~~~~~~~~~~~

src/shared/auth/auth.service.ts:1:51 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, UnauthorizedException } from "@nestjs/common";
                                                    ~~~~~~~~~~~~~~~~

src/shared/auth/auth.service.ts:2:28 - error TS2307: Cannot find module '@nestjs/jwt' or its corresponding type declarations.

2 import { JwtService } from "@nestjs/jwt";
                             ~~~~~~~~~~~~~

src/shared/auth/current-user.decorator.ts:1:56 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { createParamDecorator, ExecutionContext } from "@nestjs/common";
                                                         ~~~~~~~~~~~~~~~~

src/shared/auth/current-user.decorator.ts:2:37 - error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.

2 import { GqlExecutionContext } from "@nestjs/graphql";
                                      ~~~~~~~~~~~~~~~~~

src/shared/auth/jwt-auth.guard.ts:1:46 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, ExecutionContext } from "@nestjs/common";
                                               ~~~~~~~~~~~~~~~~

src/shared/auth/jwt-auth.guard.ts:2:27 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

2 import { AuthGuard } from "@nestjs/passport";
                            ~~~~~~~~~~~~~~~~~~

src/shared/auth/jwt.strategy.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/shared/auth/jwt.strategy.ts:2:34 - error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.

2 import { PassportStrategy } from "@nestjs/passport";
                                   ~~~~~~~~~~~~~~~~~~

src/shared/auth/jwt.strategy.ts:4:31 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

4 import { ConfigService } from "@nestjs/config";
                                ~~~~~~~~~~~~~~~~

src/shared/auth/repositories/user.repository.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/shared/auth/telegram-auth-internal.controller.ts:1:76 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
                                                                             ~~~~~~~~~~~~~~~~

src/shared/auth/telegram-auth-internal.controller.ts:3:31 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

3 import { ConfigService } from '@nestjs/config';
                                ~~~~~~~~~~~~~~~~

src/shared/auth/telegram-auth.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/shared/auth/telegram-auth.service.ts:3:28 - error TS2307: Cannot find module '@nestjs/jwt' or its corresponding type declarations.

3 import { JwtService } from '@nestjs/jwt';
                             ~~~~~~~~~~~~~

src/shared/auth/telegram-auth.service.ts:5:31 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

5 import { ConfigService } from '@nestjs/config';
                                ~~~~~~~~~~~~~~~~

src/shared/cache/context.service.ts:1:59 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
                                                            ~~~~~~~~~~~~~~~~

src/shared/cache/context.service.ts:2:31 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

2 import { ConfigService } from "@nestjs/config";
                                ~~~~~~~~~~~~~~~~

src/shared/filters/all-exceptions.filter.ts:7:8 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

7 } from "@nestjs/common";
         ~~~~~~~~~~~~~~~~

src/shared/filters/all-exceptions.filter.ts:25:32 - error TS2339: Property 'getStatus' does not exist on type 'unknown'.

25             status = exception.getStatus();
                                  ~~~~~~~~~

src/shared/filters/all-exceptions.filter.ts:26:49 - error TS2339: Property 'getResponse' does not exist on type 'unknown'.

26             const exceptionResponse = exception.getResponse();
                                                   ~~~~~~~~~~~

src/shared/filters/all-exceptions.filter.ts:31:37 - error TS2339: Property 'message' does not exist on type 'unknown'.

31                 message = exception.message;
                                       ~~~~~~~

src/shared/guards/throttler.guard.ts:1:46 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, ExecutionContext } from "@nestjs/common";
                                               ~~~~~~~~~~~~~~~~

src/shared/guards/throttler.guard.ts:2:32 - error TS2307: Cannot find module '@nestjs/throttler' or its corresponding type declarations.

2 import { ThrottlerGuard } from "@nestjs/throttler";
                                 ~~~~~~~~~~~~~~~~~~~

src/shared/memory/episodic-retrieval.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Inject, Injectable } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/shared/memory/memory-manager.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, Logger } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/shared/memory/memory.module.ts:1:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module, Global } from "@nestjs/common";
                                 ~~~~~~~~~~~~~~~~

src/shared/memory/memory.module.ts:2:30 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

2 import { ConfigModule } from "@nestjs/config";
                               ~~~~~~~~~~~~~~~~

src/shared/memory/shadow-advisory-metrics.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from "@nestjs/common";
                             ~~~~~~~~~~~~~~~~

src/shared/memory/shadow-advisory.service.ts:1:36 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Inject, Injectable } from "@nestjs/common";
                                     ~~~~~~~~~~~~~~~~

src/shared/prisma/prisma.module.ts:1:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Global, Module } from "@nestjs/common";
                                 ~~~~~~~~~~~~~~~~

src/shared/prisma/prisma.service.ts:1:59 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
                                                            ~~~~~~~~~~~~~~~~

src/shared/redis/redis.module.ts:1:32 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Module, Global } from '@nestjs/common';
                                 ~~~~~~~~~~~~~~~~

src/shared/redis/redis.service.ts:1:28 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

1 import { Injectable } from '@nestjs/common';
                             ~~~~~~~~~~~~~~~~

src/shared/redis/redis.service.ts:2:31 - error TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations.

2 import { ConfigService } from '@nestjs/config';
                                ~~~~~~~~~~~~~~~~

verify-beta.ts:3:24 - error TS2307: Cannot find module '@nestjs/common' or its corresponding type declarations.

3 import { Logger } from '@nestjs/common';
                         ~~~~~~~~~~~~~~~~

verify-beta.ts:7:22 - error TS2307: Cannot find module '@nestjs/testing' or its corresponding type declarations.

7 import { Test } from '@nestjs/testing';
                       ~~~~~~~~~~~~~~~~~

[01:52:26] Found 223 errors. Watching for file changes.