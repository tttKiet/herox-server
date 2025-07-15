[
  {
    BlockType: "NormalBlock",
    DisplayName: "Normal block",
    Icon: "Resources/Images/que_16px.png",
    Inputs: [],
    HideOnLeftMenu: false,
    IgnoreErrorMessage: false,
    NodeData: {
      $type:
        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
      nodes: [
        {
          $type:
            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
          nodes: [
            {
              $type:
                "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
              nodes: [
                {
                  $type:
                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                  nodes: [
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 18,
                      element_xpath: null,
                      output_variable_name: "linList",
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "11c3503e-9a7e-45ef-ac1d-a7482a0f8a7c",
                      display_text: null,
                      raw_input:
                        '[{"Key":"FILE_PATH","Value":"$POST_LINKS_FILE_PATH"}]',
                      comment: "Get data",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 4,
                      element_xpath: null,
                      output_variable_name: "userTTArrayLength",
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "ce3d5f50-e71c-4e76-b38c-609b538929ea",
                      display_text: null,
                      raw_input: '[{"Key":"INPUT_ARRAY","Value":"$linList"}]',
                      comment: "userTTArrayLength",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 68,
                      element_xpath: null,
                      output_variable_name: "clear",
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "025efe9b-34ab-45f5-b4ec-676d73a2fb93",
                      display_text: null,
                      raw_input:
                        '[{"Key":"FILE_OR_CODE","Value":"window.localStorage.removeItem(\\"taskLink\\");\\r\\nlocalStorage.removeItem(\\"taskLinkInteracted\\");\\r\\n\\r\\n"}]',
                      comment: "clear",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.ForBlockNode, GPMAutomateEditor.Models",
                      nodes: [
                        {
                          $type:
                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                          type: 68,
                          element_xpath: null,
                          output_variable_name: "userSaved",
                          delay: "0,0",
                          use_failed_block: false,
                          failed_block: null,
                          failed_block_expanded: false,
                          id: "bc4eec8b-0125-44b3-a2ec-b8b7f43b6708",
                          display_text: null,
                          raw_input:
                            '[{"Key":"FILE_OR_CODE","Value":"function updateLocalStorageWithUsername(username) {\\r\\n  const storageKey = \\"taskLink\\"; // Tên key trong localStorage\\r\\n  let usernames = [];\\r\\n\\r\\n  // Kiểm tra nếu đã có dữ liệu trong localStorage\\r\\n  const storedData = localStorage.getItem(storageKey);\\r\\n  if (storedData) {\\r\\n    usernames = JSON.parse(storedData); // Chuyển từ JSON về array\\r\\n  }\\r\\n\\r\\n  // Kiểm tra và thêm username nếu chưa có trong array\\r\\n  if (!usernames.includes(username)) {\\r\\n    usernames.push(username.toLowerCase());\\r\\n    localStorage.setItem(storageKey, JSON.stringify(usernames)); // Lưu lại array xuống localStorage\\r\\n  }\\r\\n}\\r\\n\\r\\nupdateLocalStorageWithUsername(\\"$linList[$loopIndex]\\");\\r\\n"}]',
                          comment: "user saved",
                        },
                      ],
                      expanded: true,
                      id: "2da5ba4a-cea0-4b41-a840-e03cc910e296",
                      display_text: null,
                      raw_input:
                        '[{"Key":"START","Value":"0"},{"Key":"END","Value":"$userTTArrayLength"},{"Key":"INCREASE_BY","Value":"1"}]',
                      comment: null,
                    },
                  ],
                  expanded: true,
                  id: "0867b23a-3ffc-424d-84c4-7b8ba7630375",
                  display_text: null,
                  raw_input: "[]",
                  comment: "Get Data User & Save Local",
                },
                {
                  $type:
                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                  nodes: [
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 44,
                      element_xpath: '//a[@href="/explore"]',
                      output_variable_name: null,
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "0151dc0f-5637-43fe-be7f-b1ac7267c9c1",
                      display_text: null,
                      raw_input: '[{"Key":"TIME_OUT","Value":"12"}]',
                      comment: "search",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 48,
                      element_xpath: null,
                      output_variable_name: null,
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "71401845-ade9-42bc-9bd9-52c66047210a",
                      display_text: null,
                      raw_input:
                        '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"//a[@href=\\"/explore\\"]"},{"Key":"POS","Value":""}]',
                      comment: "search",
                    },
                  ],
                  expanded: false,
                  id: "86721db4-ec97-45a5-9824-2c336311b1c2",
                  display_text: null,
                  raw_input: "[]",
                  comment: "Go search",
                },
                {
                  $type:
                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                  type: 1,
                  element_xpath: null,
                  output_variable_name: "modeLinkString",
                  delay: "0,0",
                  use_failed_block: false,
                  failed_block: null,
                  failed_block_expanded: false,
                  id: "dac097b9-b7e9-450f-ac67-a18a3bd8411d",
                  display_text: null,
                  raw_input:
                    '[{"Key":"VALUE","Value":"$POST_INTERACT_MODE"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"},{"Key":"COMBOBOX_DATA","Value":"Item 1, Item 2, Item 3"}]',
                  comment: "modeLinkString",
                },
                {
                  $type:
                    "GPMAutomateEditor.Models.ForBlockNode, GPMAutomateEditor.Models",
                  nodes: [
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 68,
                      element_xpath: null,
                      output_variable_name: "usernameFullInteract",
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "69c72363-e053-4925-8965-586ce46d89d9",
                      display_text: null,
                      raw_input:
                        '[{"Key":"FILE_OR_CODE","Value":"const myUsername = \\"$xUser\\"; // ví dụ: \\"llrr12122\\"\\r\\n\\r\\nfunction isMyLink(link) {\\r\\n  try {\\r\\n    const url = new URL(link);\\r\\n    const parts = url.pathname.split(\\"/\\");\\r\\n    const usernameInLink = parts[1];\\r\\n    return usernameInLink.toLowerCase() === myUsername.toLowerCase();\\r\\n  } catch (e) {\\r\\n    return false;\\r\\n  }\\r\\n}\\r\\n\\r\\nfunction app() {\\r\\n  const storedData = localStorage.getItem(\\"taskLink\\");\\r\\n  const interactedData = localStorage.getItem(\\"taskLinkInteracted\\");\\r\\n\\r\\n  let allLinks = [];\\r\\n  let interactedLinks = [];\\r\\n\\r\\n  if (storedData) {\\r\\n    allLinks = JSON.parse(storedData);\\r\\n  }\\r\\n\\r\\n  if (interactedData) {\\r\\n    interactedLinks = JSON.parse(interactedData);\\r\\n  }\\r\\n\\r\\n  // Lọc ra các link chưa tương tác và không phải của chính mình\\r\\n  const unInteractedLinks = allLinks.filter(\\r\\n    (link) => !interactedLinks.includes(link) && !isMyLink(link)\\r\\n  );\\r\\n\\r\\n  if (unInteractedLinks.length === 0) return 0;\\r\\n\\r\\n  const randomIndex = Math.floor(Math.random() * unInteractedLinks.length);\\r\\n  const selectedLink = unInteractedLinks[randomIndex];\\r\\n\\r\\n  return selectedLink;\\r\\n}\\r\\n\\r\\nreturn app();\\r\\n"}]',
                      comment: "usernameFullInteract",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                      nodes: [
                        {
                          $type:
                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                          type: 5,
                          element_xpath: null,
                          output_variable_name: null,
                          delay: "0,0",
                          use_failed_block: false,
                          failed_block: null,
                          failed_block_expanded: false,
                          id: "ceec8f27-764c-406c-acfa-70ced4c2f3ea",
                          display_text: null,
                          raw_input: "[]",
                          comment: null,
                        },
                      ],
                      expanded: false,
                      id: "990f2086-774b-4a32-b024-821e16d56ed0",
                      display_text: null,
                      raw_input:
                        '[{"Key":"CONDITION","Value":"$usernameFullInteract = 0"}]',
                      comment: "$usernameFullInteract = 0",
                    },
                    {
                      $type:
                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                      nodes: [
                        {
                          $type:
                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                          type: 68,
                          element_xpath: null,
                          output_variable_name: "isInteractFunc",
                          delay: "0,0",
                          use_failed_block: false,
                          failed_block: null,
                          failed_block_expanded: false,
                          id: "1cdecc02-dd50-4e6d-9b64-c3673be06e2d",
                          display_text: null,
                          raw_input:
                            '[{"Key":"FILE_OR_CODE","Value":"const currentLink = \\"$usernameFullInteract\\";\\r\\n// ví dụ: https://x.com/llrr12122/status/1921296376425586859\\r\\n\\r\\nconst myUsername = \\"$xUser\\"; // ví dụ: \\"llrr12122\\"\\r\\n\\r\\nfunction isMyLink(link) {\\r\\n  try {\\r\\n    const url = new URL(link);\\r\\n    const parts = url.pathname.split(\\"/\\"); // [\\"\\", \\"llrr12122\\", \\"status\\", \\"id\\"]\\r\\n\\r\\n    const usernameInLink = parts[1];\\r\\n    return usernameInLink.toLowerCase() === myUsername.toLowerCase();\\r\\n  } catch (e) {\\r\\n    return false; // nếu link không hợp lệ\\r\\n  }\\r\\n}\\r\\n\\r\\nfunction hasInteracted(link) {\\r\\n  const data = localStorage.getItem(\\"taskLinkInteracted\\");\\r\\n  if (!data) return false;\\r\\n\\r\\n  const interactedLinks = JSON.parse(data);\\r\\n  return interactedLinks.includes(link);\\r\\n}\\r\\n\\r\\nfunction markAsInteracted(link) {\\r\\n  const data = localStorage.getItem(\\"taskLinkInteracted\\");\\r\\n  let interactedLinks = data ? JSON.parse(data) : [];\\r\\n\\r\\n  if (!interactedLinks.includes(link)) {\\r\\n    interactedLinks.push(link);\\r\\n    localStorage.setItem(\\"taskLinkInteracted\\", JSON.stringify(interactedLinks));\\r\\n  }\\r\\n}\\r\\n\\r\\n// Khi vào 1 link: kiểm tra\\r\\nif (hasInteracted(currentLink) && !isMyLink(currentLink)) {\\r\\n  console.log(\\"Đã tương tác link này trước đó | Link của tôi\\");\\r\\n  return 0;\\r\\n} else {\\r\\n  console.log(\\"Chưa từng tương tác link này\\");\\r\\n  return 1;\\r\\n}\\r\\n"}]',
                          comment: "isInteractFunc",
                        },
                        {
                          $type:
                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                          nodes: [
                            {
                              $type:
                                "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                              nodes: [
                                {
                                  $type:
                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                  type: 39,
                                  element_xpath: null,
                                  output_variable_name: null,
                                  delay: "0,0",
                                  use_failed_block: false,
                                  failed_block: null,
                                  failed_block_expanded: false,
                                  id: "58e1dc2b-c33f-40b7-94e5-0e03e5850f15",
                                  display_text: null,
                                  raw_input:
                                    '[{"Key":"URL","Value":"$usernameFullInteract"},{"Key":"TIME_OUT","Value":"60"}]',
                                  comment: "Go link",
                                },
                                {
                                  $type:
                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                  type: 7,
                                  element_xpath: null,
                                  output_variable_name: null,
                                  delay: "0,0",
                                  use_failed_block: false,
                                  failed_block: null,
                                  failed_block_expanded: false,
                                  id: "644490ad-61ab-47f8-ae76-35c3b64eff01",
                                  display_text: null,
                                  raw_input:
                                    '[{"Key":"MIN","Value":"1200"},{"Key":"MAX","Value":"1800"}]',
                                  comment: null,
                                },
                                {
                                  $type:
                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                  type: 7,
                                  element_xpath: null,
                                  output_variable_name: null,
                                  delay: "0,0",
                                  use_failed_block: false,
                                  failed_block: null,
                                  failed_block_expanded: false,
                                  id: "f5d7a2fe-8da5-454b-b391-eaf560ce999e",
                                  display_text: null,
                                  raw_input:
                                    '[{"Key":"MIN","Value":"6000"},{"Key":"MAX","Value":"12000"}]',
                                  comment: "7s",
                                },
                                {
                                  $type:
                                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                  nodes: [
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                      type: 44,
                                      element_xpath: "(//article)[1]",
                                      output_variable_name: null,
                                      delay: "0,0",
                                      use_failed_block: false,
                                      failed_block: null,
                                      failed_block_expanded: false,
                                      id: "43e6adb5-143c-4666-acc7-70f4ab32c7c4",
                                      display_text: null,
                                      raw_input:
                                        '[{"Key":"TIME_OUT","Value":"24"}]',
                                      comment: "article",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                      type: 44,
                                      element_xpath:
                                        '(//article)[1] //button[@data-testid="retweet"]',
                                      output_variable_name: null,
                                      delay: "0,0",
                                      use_failed_block: false,
                                      failed_block: null,
                                      failed_block_expanded: false,
                                      id: "a7a1a14f-983b-44da-8d66-1b8a992e2006",
                                      display_text: null,
                                      raw_input:
                                        '[{"Key":"TIME_OUT","Value":"8"}]',
                                      comment: "retweet",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                      type: 7,
                                      element_xpath: null,
                                      output_variable_name: null,
                                      delay: "0,0",
                                      use_failed_block: false,
                                      failed_block: null,
                                      failed_block_expanded: false,
                                      id: "eef858f3-90cd-4f0d-a72c-4eff0b5e162c",
                                      display_text: null,
                                      raw_input:
                                        '[{"Key":"MIN","Value":"1200"},{"Key":"MAX","Value":"1800"}]',
                                      comment: null,
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 68,
                                          element_xpath: null,
                                          output_variable_name: "isFl",
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "075ed048-3917-4a69-97e9-5d4872e02608",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"FILE_OR_CODE","Value":"const action = \\"$modeLinkString\\";\\r\\n\\r\\nif (action.includes(\\"FOLLOW\\")) {\\r\\n  return 1;\\r\\n} else return 0;\\r\\n"}]',
                                          comment: "isFl",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                          nodes: [
                                            {
                                              $type:
                                                "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                              nodes: [
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 48,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "bc0016bf-9d5a-4ba8-8913-8cf2a36bea4e",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"//button[ translate(@aria-label,   \'ABCDEFGHIJKLMNOPQRSTUVWXYZ\',    \'abcdefghijklmnopqrstuvwxyz\')= concat(\'follow @\',\'$username\') or translate(@aria-label,    \'ABCDEFGHIJKLMNOPQRSTUVWXYZ\',    \'abcdefghijklmnopqrstuvwxyz\')= concat(\'follow back @\',\'$username\')]"},{"Key":"POS","Value":""}]',
                                                  comment: "Follow",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 7,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "9b262dbc-987d-44ba-86e6-2889bac8855b",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"MIN","Value":"2300"},{"Key":"MAX","Value":"4000"}]',
                                                  comment: "2s",
                                                },
                                              ],
                                              expanded: true,
                                              id: "246a12c2-cf78-4a28-8cfd-c6f4c16a0d74",
                                              display_text: null,
                                              raw_input:
                                                "[{\"Key\":\"CONDITION\",\"Value\":\"hasElement(//button[ translate(@aria-label,   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',    'abcdefghijklmnopqrstuvwxyz')= concat('follow @','$username') or translate(@aria-label,    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',    'abcdefghijklmnopqrstuvwxyz')= concat('follow back @','$username')])\"}]",
                                              comment: "has fl",
                                            },
                                          ],
                                          expanded: false,
                                          id: "7709b69b-ad48-4132-becd-e168c16d53e9",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"CONDITION","Value":"$isFl = 1"}]',
                                          comment: "$isFl = 1",
                                        },
                                      ],
                                      expanded: true,
                                      id: "8910095c-3a3a-4c71-b50b-b8de73324465",
                                      display_text: null,
                                      raw_input: "[]",
                                      comment: "ACTION FOLLOW",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 68,
                                          element_xpath: null,
                                          output_variable_name: "isLike",
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "82ea7491-37eb-4d93-935e-ed23ec168fa9",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"FILE_OR_CODE","Value":"const action = \\"$modeLinkString\\";\\r\\n\\r\\nif (action.includes(\\"LIKE\\")) {\\r\\n  return 1;\\r\\n} else return 0;\\r\\n"}]',
                                          comment: "isLike",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                          nodes: [
                                            {
                                              $type:
                                                "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                              nodes: [
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 48,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "6532be30-d016-4af8-8637-a1e9e67efba0",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"((//article[@data-testid=\\"tweet\\"])[1] //button[@data-testid=\'like\' and not(contains(@aria-label,\'Liked\'))])[1]"},{"Key":"POS","Value":""}]',
                                                  comment: "like",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 7,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "d27f9cc1-32dd-4e1b-9e6f-270d77587ac4",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"MIN","Value":"2000"},{"Key":"MAX","Value":"2300"}]',
                                                  comment: null,
                                                },
                                              ],
                                              expanded: false,
                                              id: "ab6560ed-0378-4d4d-ab57-c9dd6bd3ec6d",
                                              display_text: null,
                                              raw_input:
                                                '[{"Key":"CONDITION","Value":"hasElement(((//article[@data-testid=\\"tweet\\"])[1] //button[@data-testid=\'like\' and not(contains(@aria-label,\'Liked\'))])[1])"}]',
                                              comment: "If have like",
                                            },
                                          ],
                                          expanded: false,
                                          id: "bac36c29-f7ff-4f74-a109-e14a7516c7b4",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"CONDITION","Value":"$isLike = 1"}]',
                                          comment: "$isLike = 1",
                                        },
                                      ],
                                      expanded: true,
                                      id: "53251a6a-2d7d-4fd8-bc0b-eb126aa0fc0e",
                                      display_text: null,
                                      raw_input: "[]",
                                      comment: "ACTION LIKE",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 68,
                                          element_xpath: null,
                                          output_variable_name: "isREPOST",
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "85b6d1ed-3d8c-4784-9f42-58f653ef02d3",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"FILE_OR_CODE","Value":"const action = \\"$modeLinkString\\";\\r\\nif (action.includes(\\"REPOST\\")) {\\r\\n  return 1;\\r\\n} else return 0;\\r\\n"}]',
                                          comment: "isREPOST",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                          nodes: [
                                            {
                                              $type:
                                                "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                              nodes: [
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 7,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "4a996bf3-e345-4f87-aca4-bf10022e2d95",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"MIN","Value":"2300"},{"Key":"MAX","Value":"3400"}]',
                                                  comment: "2.5s",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 48,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "f268d8ac-63d2-4e1c-a10d-04f930654be9",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"(//article)[1] //button[@data-testid=\\"retweet\\"]"},{"Key":"POS","Value":""}]',
                                                  comment: "retweet",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 7,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "4ef000bd-fddd-4643-b15c-944835db1be8",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"MIN","Value":"2300"},{"Key":"MAX","Value":"3400"}]',
                                                  comment: "2.5s",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                  nodes: [
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 44,
                                                      element_xpath:
                                                        "(//div[@data-testid=\"Dropdown\"])[1] //span[text()='Repost']",
                                                      output_variable_name:
                                                        null,
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "09f4acdc-5bcc-47d0-87cd-bd00399fdfb8",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"TIME_OUT","Value":"4"}]',
                                                      comment: "Repost",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 7,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        null,
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "91f3c897-385f-48e3-b16d-b3de705ab03a",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"MIN","Value":"2300"},{"Key":"MAX","Value":"3400"}]',
                                                      comment: "2.5s",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 48,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            null,
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "dbe5c75c-1dd3-4818-872a-33e78073303b",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"(//div[@data-testid=\\"Dropdown\\"])[1] //span[text()=\'Repost\']"},{"Key":"POS","Value":""}]',
                                                          comment: "Dropdown",
                                                        },
                                                      ],
                                                      expanded: false,
                                                      id: "228c8167-4a8a-4d46-98ad-02316b70776b",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"CONDITION","Value":"hasElement((//div[@data-testid=\\"Dropdown\\"])[1] //span[text()=\'Repost\'])"}]',
                                                      comment: "Repost",
                                                    },
                                                  ],
                                                  expanded: false,
                                                  id: "5e86ed83-6e41-4a33-9981-0401fa50d0f8",
                                                  display_text: null,
                                                  raw_input: "[]",
                                                  comment: "dropdown",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                  type: 7,
                                                  element_xpath: null,
                                                  output_variable_name: null,
                                                  delay: "0,0",
                                                  use_failed_block: false,
                                                  failed_block: null,
                                                  failed_block_expanded: false,
                                                  id: "0ed77025-9ac0-4cef-a022-f38d7e3c51b1",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"MIN","Value":"4000"},{"Key":"MAX","Value":"5200"}]',
                                                  comment: "4.5",
                                                },
                                              ],
                                              expanded: false,
                                              id: "5ebbe50a-2b5e-4b40-8369-9bdddb1d45e1",
                                              display_text: null,
                                              raw_input:
                                                '[{"Key":"CONDITION","Value":"hasElement((//article)[1] //button[@data-testid=\\"retweet\\"])"}]',
                                              comment: "isREPOST",
                                            },
                                          ],
                                          expanded: false,
                                          id: "bda9de42-4190-4dd0-83ce-b302ceb2b690",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"CONDITION","Value":"$isREPOST = 1"}]',
                                          comment: "$isREPOST = 1",
                                        },
                                      ],
                                      expanded: false,
                                      id: "0b730a60-238f-48e5-9854-a27c3f9a5802",
                                      display_text: null,
                                      raw_input: "[]",
                                      comment: "ACTION REPOST",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 68,
                                          element_xpath: null,
                                          output_variable_name: "isCOMMENT",
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "f987a67a-8788-4575-a176-6a6ad4d23372",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"FILE_OR_CODE","Value":"const action = \\"$modeLinkString\\";\\r\\n\\r\\nif (action.includes(\\"COMMENT\\")) {\\r\\n  return 1;\\r\\n} else return 0;\\r\\n"}]',
                                          comment: "isCOMMENT",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                          nodes: [
                                            {
                                              $type:
                                                "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                              nodes: [
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                  nodes: [
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 1,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "isCmt",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "d9e26420-d072-44bc-b7cc-649ef329083e",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"VALUE","Value":"1"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"},{"Key":"COMBOBOX_DATA","Value":"Item 1, Item 2, Item 3"}]',
                                                      comment: "isCmt",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 1,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "articleCommentedXpath",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "d3a7ccfa-b02e-47d5-80c4-ab29858104c7",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"VALUE","Value":"//article[@data-testid=\\"tweet\\"] //a[translate(@href, \'ABCDEFGHIJKLMNOPQRSTUVWXYZ\', \'abcdefghijklmnopqrstuvwxyz\') = \'/$xUser\']"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"}]',
                                                      comment:
                                                        "articleCommentedXpath",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 1,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            "excludeMessage",
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "fb837b3e-2d09-42f4-98fa-39d3c931b860",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"VALUE","Value":"OK Exclude"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"},{"Key":"COMBOBOX_DATA","Value":"Item 1, Item 2, Item 3"}]',
                                                          comment:
                                                            "excludeMessage",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                          nodes: [
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 1,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "isCmt",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "604a0bc0-30ce-40b6-82e5-8ecac0e256e1",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"VALUE","Value":"0"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"}]',
                                                              comment: "isCmt",
                                                            },
                                                          ],
                                                          expanded: true,
                                                          id: "28efdb19-c5c5-4abd-9757-15941baa54f5",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"CONDITION","Value":"hasElement($articleCommentedXpath)"}]',
                                                          comment:
                                                            "articleCommentedXpath",
                                                        },
                                                      ],
                                                      expanded: true,
                                                      id: "2aa2dce7-73df-4701-86c8-430c6651d9f5",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"CONDITION","Value":"$SKIP_COMMENTED_POSTS = 1"}]',
                                                      comment:
                                                        "$SKIP_COMMENTED_POSTS = 1",
                                                    },
                                                  ],
                                                  expanded: true,
                                                  id: "762c15bf-9be3-46fb-8b0e-158da4b065c7",
                                                  display_text: null,
                                                  raw_input: "[]",
                                                  comment:
                                                    "Check commented UI | isCmt",
                                                },
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                  nodes: [
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 68,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "textPost",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "9c0b3fe0-0f4e-4c8a-89d6-69b0b7c3de61",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"FILE_OR_CODE","Value":"function escapeForJSON(str) {\\r\\n  return str\\r\\n    .replace(/\\\\\\\\/g, \\"\\\\\\\\\\\\\\\\\\") // escape backslash\\r\\n    .replace(/\\"/g, \'\\\\\\\\\\"\') // escape double quote\\r\\n    .replace(/\\\\n/g, \\"\\\\\\\\n\\") // escape newline\\r\\n    .replace(/\\\\r/g, \\"\\\\\\\\r\\") // escape carriage return\\r\\n    .replace(/\\\\t/g, \\"\\\\\\\\t\\"); // escape tab\\r\\n}\\r\\n\\r\\nconst tweetTextElement = document.querySelectorAll(\\r\\n  \'div[data-testid=\\"tweetText\\"]\'\\r\\n);\\r\\nif (tweetTextElement.length > 0) {\\r\\n  const eLast = tweetTextElement[0];\\r\\n\\r\\n  let t = eLast.textContent.trim(),\\r\\n    e = t.split(/\\\\s+/),\\r\\n    l = e.slice(0, 320),\\r\\n    i = l.join(\\" \\");\\r\\n  return escapeForJSON(i);\\r\\n} else return JSON.stringify(\\"\\");\\r\\n"}]',
                                                      comment: "textPost",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 1,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "textPost",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "9a079f8f-1004-4ebb-8f8b-5924b4a08e83",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"VALUE","Value":"$textPost"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"}]',
                                                      comment: "textPost",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                          nodes: [
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 29,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "resp",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "c050cbb4-e4c1-4389-b19f-e75bc2186219",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"URL","Value":"$serverApiUrl/ai/chat"},{"Key":"METHOD","Value":"POST"},{"Key":"HEADER","Value":"Content-Type: application/json\\r\\n"},{"Key":"DATA","Value":"{\\r\\n  \\"chatKey\\": \\"$AI_API_KEY\\",\\r\\n  \\"apiKey\\": \\"$apiKey\\",\\r\\n  \\"userMessage\\": \\"$textPost\\"\\r\\n}\\r\\n"},{"Key":"USE_PROFILE_PROXY","Value":"False"}]',
                                                              comment:
                                                                "apiChatResponseServer",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 10,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "resOk",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "d64d1743-902a-49f5-bbff-51c2fe101a4f",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"JSON","Value":"$resp"},{"Key":"NODES","Value":"ok"}]',
                                                              comment:
                                                                "ok from api",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 10,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "message",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "2cfe388c-7560-490a-aea7-8229b1e6b152",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"JSON","Value":"$resp"},{"Key":"NODES","Value":"message"}]',
                                                              comment:
                                                                "log. kết quả thực thi api",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 68,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "log",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "c77805f6-13f9-4f63-ab27-57913f348635",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"FILE_OR_CODE","Value":"const resOk = \\"$resOk\\";\\r\\n\\r\\nif (resOk == \\"False\\" || resOk == \\"false\\") {\\r\\n  console.log(\\"Response is not OK\\");\\r\\n  throw new Error(\\"$message\\" || \\"Response is not OK\\");\\r\\n}\\r\\n"}]',
                                                              comment:
                                                                "log if error api",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 10,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "respAi",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "99a1b1ee-9d2e-4416-bef7-e2f856505ec6",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"JSON","Value":"$resp"},{"Key":"NODES","Value":"data"}]',
                                                              comment: "respAi",
                                                            },
                                                          ],
                                                          expanded: false,
                                                          id: "2e7556c4-1d5b-461f-905f-1cabf9213449",
                                                          display_text: null,
                                                          raw_input: "[]",
                                                          comment:
                                                            "DEEPSEEK v3 - Server | Logger",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                          nodes: [
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 1,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                "tweetTextareaXpath",
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "4702e5ed-d00b-450e-a523-76fd5d75c8fd",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"VALUE","Value":"//div[ contains(@class,\'DraftEditor-root\')] //div[contains(@data-testid,\\"tweetTextarea\\")]"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"}]',
                                                              comment:
                                                                "tweetTextareaXpath",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 44,
                                                              element_xpath:
                                                                "$tweetTextareaXpath",
                                                              output_variable_name:
                                                                null,
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "57594622-b6d8-46b6-8eb0-a54c109745ed",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"TIME_OUT","Value":"3"}]',
                                                              comment: "input",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 54,
                                                              element_xpath:
                                                                "$tweetTextareaXpath",
                                                              output_variable_name:
                                                                null,
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "f510ed13-e463-4d5f-ab60-15aeb8cf1313",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"TYPE","Value":"TEXT"},{"Key":"KEY","Value":"$respAi"},{"Key":"DELAY_PRESS","Value":"-1"}]',
                                                              comment: "input",
                                                            },
                                                            {
                                                              $type:
                                                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                              type: 7,
                                                              element_xpath:
                                                                null,
                                                              output_variable_name:
                                                                null,
                                                              delay: "0,0",
                                                              use_failed_block: false,
                                                              failed_block:
                                                                null,
                                                              failed_block_expanded: false,
                                                              id: "a6217604-446d-425d-93d6-acb0e0adfbfd",
                                                              display_text:
                                                                null,
                                                              raw_input:
                                                                '[{"Key":"MIN","Value":"4000"},{"Key":"MAX","Value":"5200"}]',
                                                              comment: "3s",
                                                            },
                                                          ],
                                                          expanded: false,
                                                          id: "91a4b07b-59ab-442b-80e6-9563fbee38d7",
                                                          display_text: null,
                                                          raw_input: "[]",
                                                          comment: "input v2",
                                                        },
                                                      ],
                                                      expanded: false,
                                                      id: "a32525cc-1806-4341-b433-cff5bb3380c7",
                                                      display_text: null,
                                                      raw_input: "[]",
                                                      comment:
                                                        "QUEST. ai server v4",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 44,
                                                          element_xpath:
                                                            '//div[@data-testid="toolBar"] //button[@data-testid="tweetButtonInline" and not(@disabled)] //span[text()=\'Reply\']',
                                                          output_variable_name:
                                                            null,
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "67dd4ede-0306-45de-9edf-68dea739ff2c",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"TIME_OUT","Value":"4"}]',
                                                          comment: "reply",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 48,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            null,
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "a0a4af0e-caba-4c51-b750-5c0b56cb3aae",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"//div[@data-testid=\\"toolBar\\"] //button[@data-testid=\\"tweetButtonInline\\" and not(@disabled)] //span[text()=\'Reply\']"},{"Key":"POS","Value":""}]',
                                                          comment: "Reply",
                                                        },
                                                      ],
                                                      expanded: false,
                                                      id: "c14c1ea0-05ca-4e8f-a189-b4327ba7ec15",
                                                      display_text: null,
                                                      raw_input: "[]",
                                                      comment: "reply",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 44,
                                                      element_xpath:
                                                        "//span[contains(text(),'Your post was sent.')]",
                                                      output_variable_name:
                                                        null,
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "91a94435-a268-437e-9050-090f9260fd18",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"TIME_OUT","Value":"10"}]',
                                                      comment: "success",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [],
                                                      expanded: true,
                                                      id: "d54292dc-6e1b-4a3c-9d71-d59fec00b187",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"CONDITION","Value":"hasElement(//span[contains(text(),\'Your post was sent.\')])"}]',
                                                      comment:
                                                        "Your post was sent.",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 48,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            null,
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "3820a8ce-62c1-4a7c-9f2b-0a29bea28782",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"//span[text()=\'Got it\']"},{"Key":"POS","Value":""}]',
                                                          comment: "Got It",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 7,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            null,
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "93057e37-dbce-44b2-ae42-8631274afe51",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"MIN","Value":"790"},{"Key":"MAX","Value":"980"}]',
                                                          comment: null,
                                                        },
                                                      ],
                                                      expanded: true,
                                                      id: "a054702f-32b1-4749-8513-ce50d611de6d",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"CONDITION","Value":"hasElement(//span[text()=\'Got it\'])"}]',
                                                      comment: "Got It",
                                                    },
                                                  ],
                                                  expanded: true,
                                                  id: "779c0d08-ce56-438f-b62a-1c0096d65108",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"CONDITION","Value":"$isCmt = 1"}]',
                                                  comment: "$isCmt = 1",
                                                },
                                              ],
                                              expanded: true,
                                              id: "205d3746-f747-462b-8286-e94a56614555",
                                              display_text: null,
                                              raw_input: "[]",
                                              comment: "Comment",
                                            },
                                            {
                                              $type:
                                                "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                              nodes: [
                                                {
                                                  $type:
                                                    "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                                  nodes: [
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 42,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "currentLink",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "6be959d5-cac4-4cb8-8ae3-e6c15f2df627",
                                                      display_text: null,
                                                      raw_input: "[]",
                                                      comment: "currentLink",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                      type: 68,
                                                      element_xpath: null,
                                                      output_variable_name:
                                                        "targetUserName",
                                                      delay: "0,0",
                                                      use_failed_block: false,
                                                      failed_block: null,
                                                      failed_block_expanded: false,
                                                      id: "c4587ab3-f5fd-4691-b365-9c143833c341",
                                                      display_text: null,
                                                      raw_input:
                                                        '[{"Key":"FILE_OR_CODE","Value":"// convert input\\r\\nconst urlArray = \\"$currentLink\\".split(\\"/\\");\\r\\nconst username = urlArray[3];\\r\\nconsole.log(\\"username\\", username.toLocaleLowerCase());\\r\\n\\r\\nreturn username.toLocaleLowerCase();\\r\\n"}]',
                                                      comment: "targetUserName",
                                                    },
                                                    {
                                                      $type:
                                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                                      nodes: [
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 1,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            "authorUsername",
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "4d9cf948-e764-451c-917b-60439e696501",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"VALUE","Value":"$xUser"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"}]',
                                                          comment:
                                                            "authorUsername",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 1,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            "targetUsername",
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "320f7900-ba4b-45f1-b7d3-fcd793ed6d5d",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"VALUE","Value":"$targetUserName"},{"Key":"ALLOW_USER_INPUT","Value":"False"},{"Key":"USER_INPUT_TYPE","Value":"Text"},{"Key":"COMBOBOX_DATA","Value":"Item 1, Item 2, Item 3"}]',
                                                          comment:
                                                            "targetUsername",
                                                        },
                                                        {
                                                          $type:
                                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                                          type: 29,
                                                          element_xpath: null,
                                                          output_variable_name:
                                                            "apiSaveLink",
                                                          delay: "0,0",
                                                          use_failed_block: false,
                                                          failed_block: null,
                                                          failed_block_expanded: false,
                                                          id: "6246c2c0-ea7b-491a-8ad2-c2f1108f7eb3",
                                                          display_text: null,
                                                          raw_input:
                                                            '[{"Key":"URL","Value":"$serverApiUrl/x/save-interact-post"},{"Key":"METHOD","Value":"POST"},{"Key":"HEADER","Value":"Content-Type: application/json"},{"Key":"DATA","Value":"{\\r\\n  \\"authorUsername\\": \\"$authorUsername\\",\\r\\n  \\"targetUsername\\": \\"$targetUsername\\",\\r\\n  \\"postId\\": \\"$currentLink\\",\\r\\n   \\"apiKey\\": \\"$apiKey\\"\\r\\n}\\r\\n"},{"Key":"USE_PROFILE_PROXY","Value":"False"}]',
                                                          comment:
                                                            "apiSaveLink",
                                                        },
                                                      ],
                                                      expanded: true,
                                                      id: "53c825ab-f028-4672-b36c-423ad961ae62",
                                                      display_text: null,
                                                      raw_input: "[]",
                                                      comment:
                                                        "API POST => saveLink",
                                                    },
                                                  ],
                                                  expanded: true,
                                                  id: "68d117af-c78a-45ed-8fa2-a70476846f02",
                                                  display_text: null,
                                                  raw_input:
                                                    '[{"Key":"CONDITION","Value":"1=1"}]',
                                                  comment: "true",
                                                },
                                              ],
                                              expanded: true,
                                              id: "c72fd432-0db7-42e9-9184-001d936aa262",
                                              display_text: null,
                                              raw_input: "[]",
                                              comment: "Save link commented",
                                            },
                                          ],
                                          expanded: true,
                                          id: "996d7968-19fe-4318-975c-e796024d4bfa",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"CONDITION","Value":"$isCOMMENT = 1"}]',
                                          comment: "$isCOMMENT = 1",
                                        },
                                      ],
                                      expanded: false,
                                      id: "f7881617-3834-402e-bb64-66a4bf76f9ef",
                                      display_text: null,
                                      raw_input: "[]",
                                      comment: "ACTION COMMENT",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 7,
                                          element_xpath: null,
                                          output_variable_name: null,
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "8003fe08-9122-4e11-8d52-33dc3d1726ce",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"MIN","Value":"1200"},{"Key":"MAX","Value":"1300"}]',
                                          comment: "1s",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 48,
                                          element_xpath: null,
                                          output_variable_name: null,
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "4286af11-acd9-4ab2-9420-c35365de9302",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"//button[@aria-label=\\"Back\\"]"},{"Key":"POS","Value":""}]',
                                          comment: "back",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 7,
                                          element_xpath: null,
                                          output_variable_name: null,
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "e1fc191d-5bfa-475a-aefe-28c92c6edefd",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"MIN","Value":"1200"},{"Key":"MAX","Value":"1300"}]',
                                          comment: "1s",
                                        },
                                      ],
                                      expanded: false,
                                      id: "7954bf34-69d1-463a-9816-52f2347fcfc9",
                                      display_text: null,
                                      raw_input:
                                        '[{"Key":"CONDITION","Value":"hasElement(//button[@aria-label=\\"Back\\"])"}]',
                                      comment: "back",
                                    },
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                      nodes: [
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 9,
                                          element_xpath: null,
                                          output_variable_name:
                                            "delayAfterCommentArray",
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "271ca163-4088-44b7-8047-c43ff04113d3",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"INPUT_TEXT","Value":"$COMMENT_DELAY_RANGE"},{"Key":"SPLIT_CHAR","Value":","}]',
                                          comment: "delayAfterCommentArray",
                                        },
                                        {
                                          $type:
                                            "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                          type: 7,
                                          element_xpath: null,
                                          output_variable_name: null,
                                          delay: "0,0",
                                          use_failed_block: false,
                                          failed_block: null,
                                          failed_block_expanded: false,
                                          id: "768289b2-2961-4c5d-8423-639ae8d154b5",
                                          display_text: null,
                                          raw_input:
                                            '[{"Key":"MIN","Value":"$delayAfterCommentArray[0]"},{"Key":"MAX","Value":"$delayAfterCommentArray[1]"}]',
                                          comment: "delay after comment",
                                        },
                                      ],
                                      expanded: true,
                                      id: "10fb13ed-09c1-4f92-b7dc-cac33ecb3c58",
                                      display_text: null,
                                      raw_input: "[]",
                                      comment: "After delay",
                                    },
                                  ],
                                  expanded: true,
                                  id: "63a27c52-0751-4d60-b729-cf864efa812e",
                                  display_text: null,
                                  raw_input: "[]",
                                  comment: "handle action x",
                                },
                                {
                                  $type:
                                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                                  nodes: [
                                    {
                                      $type:
                                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                                      type: 68,
                                      element_xpath: null,
                                      output_variable_name:
                                        "savelinkInteracted",
                                      delay: "0,0",
                                      use_failed_block: false,
                                      failed_block: null,
                                      failed_block_expanded: false,
                                      id: "198568b2-857f-4445-9be3-bc389237b6f2",
                                      display_text: null,
                                      raw_input:
                                        '[{"Key":"FILE_OR_CODE","Value":"const currentLink = \\"$usernameFullInteract\\";\\r\\n\\r\\nfunction markAsInteracted(link) {\\r\\n  const data = localStorage.getItem(\\"taskLinkInteracted\\");\\r\\n  let interactedLinks = data ? JSON.parse(data) : [];\\r\\n\\r\\n  if (!interactedLinks.includes(link)) {\\r\\n    interactedLinks.push(link);\\r\\n    localStorage.setItem(\\"taskLinkInteracted\\", JSON.stringify(interactedLinks));\\r\\n  }\\r\\n}\\r\\n\\r\\nmarkAsInteracted(currentLink);\\r\\n"}]',
                                      comment: "savelinkInteracted",
                                    },
                                  ],
                                  expanded: true,
                                  id: "e8af0989-6ee8-46c5-af30-f4f2588b3dfc",
                                  display_text: null,
                                  raw_input: "[]",
                                  comment: "Save",
                                },
                              ],
                              expanded: true,
                              id: "9264985a-d194-4328-aff9-20fe6e0dca95",
                              display_text: null,
                              raw_input: "[]",
                              comment: "Link",
                            },
                            {
                              $type:
                                "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                              type: 7,
                              element_xpath: null,
                              output_variable_name: null,
                              delay: "0,0",
                              use_failed_block: false,
                              failed_block: null,
                              failed_block_expanded: false,
                              id: "d33b2e1a-6d19-4f78-9d55-2f210f0412ab",
                              display_text: null,
                              raw_input:
                                '[{"Key":"MIN","Value":"4000"},{"Key":"MAX","Value":"6500"}]',
                              comment: null,
                            },
                          ],
                          expanded: true,
                          id: "969a47bf-1137-4b42-a840-ad71b437d764",
                          display_text: null,
                          raw_input:
                            '[{"Key":"CONDITION","Value":"$isInteractFunc = 1"}]',
                          comment: "$isInteractFunc = 1",
                        },
                      ],
                      expanded: true,
                      id: "0a8825bb-35f4-4f43-9f99-75aedf8e47ea",
                      display_text: null,
                      raw_input: "[]",
                      comment: "Check interact",
                    },
                  ],
                  expanded: true,
                  id: "749d5ba4-73ff-4852-a130-1ee52f797460",
                  display_text: null,
                  raw_input:
                    '[{"Key":"START","Value":"0"},{"Key":"END","Value":"$userTTArrayLength"},{"Key":"INCREASE_BY","Value":"1"}]',
                  comment: "for interact user",
                },
                {
                  $type:
                    "GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models",
                  nodes: [
                    {
                      $type:
                        "GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models",
                      type: 48,
                      element_xpath: null,
                      output_variable_name: null,
                      delay: "0,0",
                      use_failed_block: false,
                      failed_block: null,
                      failed_block_expanded: false,
                      id: "a53a6880-ade8-4a00-96ee-a9e3f167f653",
                      display_text: null,
                      raw_input:
                        '[{"Key":"CLICK_TYPE","Value":"CLICK_XPATH"},{"Key":"XPATH","Value":"(//a[@href=\\"/home\\"]) [last()]"},{"Key":"POS","Value":""}]',
                      comment: "home",
                    },
                  ],
                  expanded: true,
                  id: "8f32b210-a525-4866-bd47-a3edf17e3e6c",
                  display_text: null,
                  raw_input: "[]",
                  comment: "Back Home",
                },
              ],
              expanded: true,
              id: "97f2eae3-1399-4390-855b-8ec4bffffaef",
              display_text: null,
              raw_input: "[]",
              comment: "Flow",
            },
          ],
          expanded: true,
          id: "ff2dcbb2-15f0-4358-9463-feae9548e56b",
          display_text: null,
          raw_input: '[{"Key":"CONDITION","Value":"$isInteractLink = True"}]',
          comment: "$isInteractLink = True",
        },
      ],
      expanded: false,
      id: "79637a4f-a4c1-4809-bd49-bd9a3a0e16a1",
      display_text: null,
      raw_input: "[]",
      comment: "Link",
    },
  },
];
