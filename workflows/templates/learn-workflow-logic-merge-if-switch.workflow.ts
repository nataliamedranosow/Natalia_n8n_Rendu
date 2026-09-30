const start_Sorting = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Start Sorting', position: [848, 720] }
});

const _1_Merge_Node = merge({
  version: 3.2,
  config: { name: '1. Merge Node', parameters: { numberInputs: 3 }, position: [1600, 704] }
});

const create_Letter = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Create Letter', parameters: { assignments: { assignments: [{ id: '12345', name: 'package_id', type: 'string', value: 'L-001' }, { id: '67890', name: 'type', type: 'string', value: 'letter' }, { id: 'abcde', name: 'destination', type: 'string', value: 'London' }] }, options: {} }, position: [1232, 528] }
});

const create_Parcel = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Create Parcel', parameters: { assignments: { assignments: [{ id: '12345', name: 'package_id', type: 'string', value: 'P-001' }, { id: '67890', name: 'type', type: 'string', value: 'parcel' }, { id: 'abcde', name: 'destination', type: 'string', value: 'New York' }, { id: 'fghij', name: 'is_fragile', type: 'boolean', value: true }] }, options: {} }, position: [1232, 912] }
});

const create_2nd_Letter = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Create 2nd Letter', parameters: { assignments: { assignments: [{ id: '12345', name: 'package_id', type: 'string', value: 'L-002' }, { id: '67890', name: 'type', type: 'string', value: 'letter' }, { id: 'abcde', name: 'destination', type: 'string', value: 'Tokyo' }] }, options: {} }, position: [1232, 720] }
});

const _2_IF_Node = node({
  type: 'n8n-nodes-base.if',
  version: 2.2,
  config: { name: '2. IF Node', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, combinator: 'and', conditions: [{ id: 'a68aad83-1d09-4ebe-9732-aaedc407bb4b', operator: { type: 'boolean', operation: 'true', singleValue: true }, leftValue: expr('{{ $json.is_fragile }}'), rightValue: '' }] }, looseTypeValidation: true, options: {} }, position: [2000, 720] }
});

const add_Fragile_Handling = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Add \'Fragile\' Handling', parameters: { assignments: { assignments: [{ id: '12345', name: 'handling_instructions', type: 'string', value: 'Handle with care!' }] }, includeOtherFields: true, options: {} }, position: [2352, 624] }
});

const re_group_All_Packages = merge({
  version: 3.2,
  config: { name: 'Re-group All Packages', position: [2688, 720] }
});

const add_Standard_Handling = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Add \'Standard\' Handling', parameters: { assignments: { assignments: [{ id: '12345', name: 'handling_instructions', type: 'string', value: 'Standard handling' }] }, includeOtherFields: true, options: {} }, position: [2352, 816] }
});

const _3_Switch_Node = node({
  type: 'n8n-nodes-base.switch',
  version: 3.2,
  config: { name: '3. Switch Node', parameters: { rules: { values: [{ conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: '8d43cde4-027a-4ca7-a24c-6f74f12d6238', operator: { type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.destination }}'), rightValue: 'London' }] }, renameOutput: true, outputKey: 'London' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: '399a0fbd-6be5-48e9-9f66-04cf385cb418', operator: { name: 'filter.operator.equals', type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.destination }}'), rightValue: 'New York' }] }, renameOutput: true, outputKey: 'New York' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and', conditions: [{ id: 'a69d387d-a174-42b3-bc5f-c8b46b7c2375', operator: { name: 'filter.operator.equals', type: 'string', operation: 'equals' }, leftValue: expr('{{ $json.destination }}'), rightValue: 'Tokyo' }] }, renameOutput: true, outputKey: 'Tokyo' }] }, options: { fallbackOutput: 'extra', renameFallbackOutput: 'Default' } }, position: [3120, 688] }
});

const send_to_London_Bin = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Send to London Bin', parameters: { assignments: { assignments: [{ id: '12345', name: 'sorting_bin', type: 'string', value: 'A1 (London)' }] }, includeOtherFields: true, options: {} }, position: [3504, 432] }
});

const final_Sorted_Packages = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Final Sorted Packages', position: [3888, 736] }
});

const send_to_New_York_Bin = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Send to New York Bin', parameters: { assignments: { assignments: [{ id: '12345', name: 'sorting_bin', type: 'string', value: 'B2 (New York)' }] }, includeOtherFields: true, options: {} }, position: [3504, 624] }
});

const send_to_Tokyo_Bin = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Send to Tokyo Bin', parameters: { assignments: { assignments: [{ id: '12345', name: 'sorting_bin', type: 'string', value: 'C3 (Tokyo)' }] }, includeOtherFields: true, options: {} }, position: [3504, 816] }
});

const default_Bin = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Default Bin', parameters: { assignments: { assignments: [{ id: '12345', name: 'sorting_bin', type: 'string', value: 'Return to Sender' }] }, includeOtherFields: true, options: {} }, position: [3504, 1008] }
});

const wf = workflow('QmIxg2VjU0c2OOqX', '🎓 Learn Workflow Logic with Merge, IF & Switch Operations', { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: true });

export default wf
  .add(start_Sorting
  .to([
    create_Parcel,
    create_2nd_Letter,
    create_Letter]))
  .add(sticky('### Tutorial: The Logic Trio (Merge, IF, Switch)\n\nWelcome! This workflow will teach you the three most important nodes for controlling the flow of your data.\n\n**The Analogy: A Package Sorting Center**\n- **Data Items:** Think of these as packages moving on a conveyor belt.\n- **Merge Node:** A point where multiple conveyor belts combine into one.\n- **IF Node:** A simple sorting gate with two paths (e.g., "Fragile" or "Not Fragile").\n- **Switch Node:** An advanced sorting machine with many paths (e.g., sorting by destination city).\n\n\n**How to use this tutorial:**\n1.  Click **"Execute Workflow"**.\n2.  Follow the flow from left to right, clicking on each node to see its output.\n3.  Read the sticky notes to understand what each node does.\n\n\n---\n\n### Automate your operations today\nYour time is valuable. Let us automate the boring stuff for you.\n\n**👇 CHOOSE YOUR PATH:**\n\n[ **⚡️ I WANT A FREE AUDIT (2 min)** ](https://workflows.ac/audit?utm_source=n8n_template&utm_medium=workflow_note&utm_campaign=learn_workflow_logic_with_merge_if_switch_operations&utm_content=5996)\n> *We\'ve put our heart into this business evaluation machine.*\n\n[ **💡 I HAVE A SPECIFIC REQUEST** ](https://workflows.ac/form?utm_source=n8n_template&utm_medium=workflow_note&utm_campaign=learn_workflow_logic_with_merge_if_switch_operations&utm_content=5996)\n\n', [start_Sorting], { name: 'Sticky Note', width: 624, height: 660, position: [368, 240] }))
  .add(sticky('### 1. The Merge Node\n\n**Analogy:** A conveyor belt where packages from different loading docks (the `Set` nodes) come together.\n\n**What it does:** The Merge node combines multiple streams of data into a single stream.\n\nHere, it\'s set to **Append** mode, which is the most common. It waits for all incoming data and then passes it all through together.\n\n**➡️ Look at the output. We now have both the letter and the parcel in one list, ready for the next step!**', [_1_Merge_Node], { name: 'Sticky Note1', color: 4, width: 384, height: 604, position: [1456, 304] }))
  .add(sticky('### 2. The IF Node\n\n**Analogy:** A simple sorting gate with two paths: a "true" path and a "false" path.\n\n**What it does:** The IF node checks if a condition is met. If it\'s true, the data goes down the top output. If it\'s false, it goes down the bottom output.\n\nHere, we\'re asking a simple question: **"Does this package have an `is_fragile` property?"**\n\n**➡️ The parcel will go down the \'true\' path, and the letters (which don\'t have that property) will go down the \'false\' path.**', [_2_IF_Node], { name: 'Sticky Note2', color: 4, width: 384, height: 596, position: [1872, 304] }))
  .add(sticky('### Merge Again?\n\n**Why do we need another Merge node here?**\n\nAfter the IF node, our data was split into two different paths. Before we can perform the *next* sorting step on all packages, we need to get them back onto the same conveyor belt.\n\nThis is a very common and important pattern in n8n: \n**Split -> Process -> Merge.**', [re_group_All_Packages], { name: 'Sticky Note3', color: 5, width: 384, height: 552, position: [2544, 384] }))
  .add(sticky('### 3. The Switch Node\n\n**Analogy:** An advanced sorting machine that can send packages to many different destinations.\n\n**What it does:** The Switch node is like an IF node with multiple doors. It checks the value of a single field (`destination` in this case) and sends the data down the path that matches the value.\n\n- If the destination is "London", it goes to output 0.\n- If it\'s "New York", it goes to output 1.\n- If it\'s something else, it goes to the **default** output.\n\n\n**➡️ This is much cleaner than using many IF nodes chained together!**', [_3_Switch_Node], { name: 'Sticky Note4', color: 4, width: 400, height: 648, position: [2960, 288] }))
  .add(sticky('### All Packages Sorted!\n\nCongratulations! You\'ve successfully used the three logic nodes to sort your packages.\n\n**You learned how to:**\n- **Merge** data from different sources.\n- Use **IF** for simple true/false decisions.\n- Use **Switch** for complex, multi-path routing.\n\n\nMastering these three nodes is the key to building powerful and intelligent workflows in n8n.', [final_Sorted_Packages], { name: 'Sticky Note5', color: 6, width: 368, height: 560, position: [3760, 384] }))
  .add(sticky('## Was this helpful? Let me know!\n[![clic](https://supastudio.ia2s.app/storage/v1/object/public/assets/n8n/clic_down_lucas.gif)](https://workflows.ac/form)\n\nI really hope this template helped you. Your feedback is what helps me create better resources for the n8n community.\n\n### **Have Feedback, a Question, or a Project Idea?**\n\n\n#### ➡️ **[Click here to go to the Contact Form](https://workflows.ac/form?utm_source=n8n_template&utm_medium=workflow_note&utm_campaign=learn_workflow_logic_with_merge_if_switch_operations&utm_content=5996)**\n\nUse this single link for anything you need:\n\n*   **Give Feedback:** Share your thoughts on this template, whether you found a typo, encountered an unexpected error, have a suggestion, or just want to say thanks!\n\n*   **Automation Coaching:** Get personalized, one-on-one guidance to master n8n. We can work together to help you reach an expert level.\n\n*   **Automation Consulting:** Have a complex business challenge or need custom workflows built from scratch? We offer a plug and play automation department for 8 to 88 people teams with unlimited automation requests.\n\n---\n\nHappy Automating!\nLucas Peyrin | [Workflows Accelerator](https://workflows.ac?utm_source=n8n_template&utm_medium=workflow_note&utm_campaign=learn_workflow_logic_with_merge_if_switch_operations&utm_content=5996)', [], { name: 'Sticky Note6', color: 7, width: 544, height: 1088, position: [4160, -144] }))
  .add(create_Letter.to(_1_Merge_Node.input(0)))
  .add(create_Parcel.to(_1_Merge_Node.input(2)))
  .add(create_2nd_Letter.to(_1_Merge_Node.input(1)))
  .add(add_Fragile_Handling.to(re_group_All_Packages.input(0)))
  .add(add_Standard_Handling.to(re_group_All_Packages.input(1)))
  .add(_1_Merge_Node)
  .to(_2_IF_Node.onTrue(add_Fragile_Handling).onFalse(add_Standard_Handling))
  .add(re_group_All_Packages)
  .to(_3_Switch_Node.onCase(0, send_to_London_Bin
    .to(final_Sorted_Packages)).onCase(1, send_to_New_York_Bin
    .to(final_Sorted_Packages)).onCase(2, send_to_Tokyo_Bin
    .to(final_Sorted_Packages)).onCase(3, default_Bin
    .to(final_Sorted_Packages)))