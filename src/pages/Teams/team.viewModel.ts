import { WorkspaceService } from "$lib/services/workspace.service";

import { WorkspaceRepository } from "$lib/repositories/workspace.repository";
import {
  requestResponseStore,
  tabs,
} from "$lib/store/request-response-section";
import { TabRepository } from "$lib/repositories/tab.repository";
import { CollectionRepository } from "$lib/repositories/collection.repository";
import { TeamService } from "$lib/services/team.service";
import { TeamRepository } from "$lib/repositories/team.repository";
import type { TeamDocument } from "$lib/database/app.database";
import type { InviteBody } from "$lib/utils/dto/team-dto";

export class TeamViewModel {
  constructor() {}
  private workspaceRepository = new WorkspaceRepository();
  private tabRepository = new TabRepository();
  private collectionRepository = new CollectionRepository();
  private workspaceService = new WorkspaceService();
  private teamService = new TeamService();
  private teamRepository = new TeamRepository();

  public debounce = (func, delay) => {
    let timerId;

    return function (...args) {
      /* eslint-disable @typescript-eslint/no-this-alias */
      const context = this;

      clearTimeout(timerId);
      timerId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  };

  public syncTabWithStore = () => {
    this.tabRepository.syncTabsWithStore(tabs);
  };

  debouncedTab = this.debounce(this.syncTabWithStore, 2000);

  get tabs() {
    return requestResponseStore.getTabList();
  }

  public get collection() {
    return this.collectionRepository.getCollection();
  }

  public get workspaces() {
    return this.workspaceRepository.getWorkspaces();
  }

  public get teams() {
    return this.teamRepository.getTeams();
  }

  public get activeTeam() {
    return this.teamRepository.getActiveTeam();
  }

  public get openTeam() {
    return this.teamRepository.getOpenTeam();
  }

  public get activeWorkspace() {
    return this.workspaceRepository.getActiveWorkspace();
  }

  public checkActiveTeam = async (teamId: string): Promise<boolean> => {
    return await this.teamRepository.checkActiveTeam(teamId);
  };

  public activateTeam = (teamId: string): void => {
    this.teamRepository.setActiveTeam(teamId);
    return;
  };

  public addTeam = async (team) => {
    await this.teamRepository.createTeam(team);
  };
  public modifyTeam = async (teamId, team) => {
    await this.teamRepository.modifyTeam(teamId, team);
  };

  public createTeam = async (team) => {
    const response = await this.teamService.createTeam(team);
    return response;
  };

  public activateInitialTeamWorkspace = async (): Promise<void> => {
    const workspaceIdToActivate =
      await this.teamRepository.activateInitialTeamWithWorkspace();
    if (workspaceIdToActivate)
      await this.workspaceRepository.setActiveWorkspace(workspaceIdToActivate);
    return;
  };

  public getTeamDocument = (elem: TeamDocument) => {
    return {
      teamId: elem.get("teamId"),
      name: elem.get("name"),
      logo: elem.get("logo"),
      workspaces: elem.get("workspaces"),
      users: elem.get("users"),
      owner: elem.get("owner"),
      admins: elem.get("admins"),
      isActiveTeam: elem.get("isActiveTeam"),
      createdAt: elem.get("createdAt"),
      createdBy: elem.get("createdBy"),
      updatedAt: elem.get("updatedAt"),
      updatedBy: elem.get("updatedBy"),
    };
  };

  public handleCreateTab = (data) => {
    requestResponseStore.createTab(data);
    this.debouncedTab();
  };

  public addWorkspace = async (workspace) => {
    await this.workspaceRepository.addWorkspace(workspace);
  };

  public updateWorkspace = async (id, data) => {
    await this.workspaceRepository.updateWorkspace(id, data);
  };

  public createWorkspace = async (workspace) => {
    const response = await this.workspaceService.createWorkspace(workspace);
    return response;
  };
  public getTeamData = async () => {
    return await this.teamRepository.getTeamData();
  };
  // sync teams data with backend server
  public refreshTeams = async (userId: string): Promise<void> => {
    let openTeamId: string = "";
    const teamsData = await this.getTeamData();
    teamsData.forEach((element) => {
      const elem = element.toMutableJSON();
      console.log(elem);
      if (elem.isOpen) openTeamId = elem.teamId;
    });
    const response = await this.teamService.fetchTeams(userId);
    if (response?.isSuccessful && response?.data?.data) {
      const data = response.data.data.map((elem) => {
        const {
          _id,
          name,
          users,
          logo,
          workspaces,
          owner,
          admins,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy,
        } = elem;
        const updatedWorkspaces = workspaces.map((workspace) => ({
          workspaceId: workspace.id,
          name: workspace.name,
        }));
        return {
          teamId: _id,
          name,
          users,
          logo,
          workspaces: updatedWorkspaces,
          owner,
          admins,
          isActiveTeam: false,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy,
        };
      });
      if (openTeamId) {
        data.forEach((elem) => {
          if (elem.teamId === openTeamId) {
            elem.isOpen = true;
          } else {
            elem.isOpen = false;
          }
        });
      } else {
        data[0].isOpen = true;
      }

      await this.teamRepository.bulkInsertData(data);
    }
  };

  // service
  public inviteMembersAtTeam = async (
    teamId: string,
    inviteBody: InviteBody,
  ) => {
    const response = await this.teamService.inviteMembersAtTeam(
      teamId,
      inviteBody,
    );
    if (response.isSuccessful === true) {
      return response.data.data;
    }
    return;
  };

  public removeMembersAtTeam = async (teamId: string, userId: string) => {
    const response = await this.teamService.removeMembersAtTeam(teamId, userId);
    if (response.isSuccessful === true) {
      return response.data.data;
    }
    return;
  };

  public promoteToAdminAtTeam = async (teamId: string, userId: string) => {
    const response = await this.teamService.promoteToAdminAtTeam(
      teamId,
      userId,
    );
    if (response.isSuccessful === true) {
      return response.data.data;
    }
    return;
  };

  public demoteToMemberAtTeam = async (teamId: string, userId: string) => {
    const response = await this.teamService.demoteToMemberAtTeam(
      teamId,
      userId,
    );
    if (response.isSuccessful === true) {
      return response.data.data;
    }
    return;
  };

  public promoteToOwnerAtTeam = async (teamId: string, userId: string) => {
    const response = await this.teamService.promoteToOwnerAtTeam(
      teamId,
      userId,
    );
    if (response.isSuccessful === true) {
      return response.data.data;
    }
    return;
  };
  public setOpenTeam = async (teamId) => {
    await this.teamRepository.setOpenTeam(teamId);
  };
  // public modifyTeam = async (teamId, team) => {
  //   this.teamRepository.modifyTeam(teamId, team);
  // };
}
