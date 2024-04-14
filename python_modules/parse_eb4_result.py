#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
@Authors: yanyiming(yanyiming@baidu.com)
@Date:    20240229
@Description: 解析一言4的结果
- 输入文件格式：[prompt, eb4_evaluation_json_str]
"""

import sys
import json

file_input = sys.argv[1]
file_output = sys.argv[2]

with open(file_input, 'r', encoding='utf-8', errors='ignore') as fi, \
    open(file_output, 'w', encoding='utf-8') as fo:
    line_id = 0
    for line in fi:
        # fo.write("======================================== 题目" + str(line_id) + " ========================================\n")
        line = line.strip()
        if len(line.split('\t')) == 2:
            prompt, json_str = line.split('\t')

        parse_dict = json.loads(json_str[1:-1])
        text = parse_dict['text']   # eb4生成结果
        
        fo.write(text + '\n')
        line_id += 1


# python3 parse_eb4_result.py data_output_aigc_text_wenxinyiyan4 data_parsed.txt
